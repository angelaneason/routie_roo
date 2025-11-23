import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createRoute, 
  createRouteWaypoints, 
  getUserRoutes, 
  getRouteById,
  getRouteByShareId,
  getRouteWaypoints,
  upsertCachedContacts,
  getUserCachedContacts,
  clearUserCachedContacts,
  getDb,
  deleteRoute,
  updateRoute,
  createFolder,
  getUserFolders,
  updateFolder,
  deleteFolder
} from "./db";
import { 
  getGoogleAuthUrl, 
  exchangeCodeForToken, 
  fetchGoogleContacts, 
  parseGoogleContacts,
  createCalendarEvent
} from "./googleAuth";
import { TRPCError } from "@trpc/server";
import { users, routes, routeWaypoints, stopTypes, savedStartingPoints } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Helper to calculate route using Google Maps Routes API
async function calculateRoute(waypoints: Array<{ address: string; name?: string }>) {
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!GOOGLE_MAPS_API_KEY) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Google Maps API key not configured",
    });
  }

  if (waypoints.length < 2) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "At least 2 waypoints required",
    });
  }

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediates = waypoints.slice(1, -1);

  const requestBody: any = {
    origin: {
      address: origin.address,
    },
    destination: {
      address: destination.address,
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
    },
  };

  if (intermediates.length > 0) {
    requestBody.intermediates = intermediates.map(wp => ({
      address: wp.address,
    }));
    // Don't set optimizeWaypointOrder - we'll handle ordering manually
  }

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline,routes.legs,routes.optimizedIntermediateWaypointIndex",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to calculate route: ${error}`,
    });
  }

  const data = await response.json();
  
  if (!data.routes || data.routes.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No route found for the given waypoints",
    });
  }

  return data.routes[0];
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  contacts: router({
    // Get Google OAuth URL
    getGoogleAuthUrl: protectedProcedure.query(({ ctx }) => {
      const protocol = ctx.req.protocol || 'https';
      const host = ctx.req.headers.host || '';
      const redirectUri = `${protocol}://${host}/api/oauth/google/callback`;
      const state = ctx.user.id.toString();
      return { url: getGoogleAuthUrl(redirectUri, state) };
    }),

    // Handle OAuth callback (called from backend route)
    handleGoogleCallback: publicProcedure
      .input(z.object({
        code: z.string(),
        userId: z.number(),
        redirectUri: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Exchange code for token
          const tokenData = await exchangeCodeForToken(input.code, input.redirectUri);
          
          // Fetch contacts
          const googleContacts = await fetchGoogleContacts(tokenData.access_token);
          
          // Parse all contacts (including those without addresses)
          const parsedContacts = parseGoogleContacts(googleContacts);
          
          // Clear old cached contacts
          await clearUserCachedContacts(input.userId);
          
          // Cache new contacts
          const contactsToCache = parsedContacts.map(contact => ({
            userId: input.userId,
            googleResourceName: contact.resourceName,
            name: contact.name,
            email: contact.email,
            address: contact.address,
            phoneNumbers: contact.phoneNumbers,
            photoUrl: contact.photoUrl,
            labels: contact.labels,
          }));
          
          if (contactsToCache.length > 0) {
            await upsertCachedContacts(contactsToCache);
          }
          
          return { success: true, count: contactsToCache.length };
        } catch (error) {
          console.error("Error handling Google callback:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to sync contacts",
          });
        }
      }),

    // Get cached contacts
    list: protectedProcedure.query(async ({ ctx }) => {
      const contacts = await getUserCachedContacts(ctx.user.id);
      return contacts;
    }),

    // Refresh contacts from Google
    refresh: protectedProcedure.mutation(async ({ ctx }) => {
      // This will trigger a new OAuth flow
      const protocol = ctx.req.protocol || 'https';
      const host = ctx.req.headers.host || '';
      const redirectUri = `${protocol}://${host}/api/oauth/google/callback`;
      const state = ctx.user.id.toString();
      return { url: getGoogleAuthUrl(redirectUri, state) };
    }),

    // Update contact information
    update: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        name: z.string(),
        email: z.string(),
        address: z.string(),
        phoneNumbers: z.array(z.object({
          value: z.string(),
          label: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { cachedContacts } = await import("../drizzle/schema");
        
        await db.update(cachedContacts)
          .set({
            name: input.name,
            email: input.email,
            address: input.address,
            phoneNumbers: JSON.stringify(input.phoneNumbers),
            updatedAt: new Date(),
          })
          .where(eq(cachedContacts.id, input.contactId));

        return { success: true };
      }),

    // Toggle contact active status
    toggleActive: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { cachedContacts } = await import("../drizzle/schema");
        
        await db.update(cachedContacts)
          .set({
            isActive: input.isActive ? 1 : 0,
            updatedAt: new Date(),
          })
          .where(eq(cachedContacts.id, input.contactId));

        return { success: true };
      }),
  }),

  folders: router({
    // List user's folders
    list: protectedProcedure.query(async ({ ctx }) => {
      const folders = await getUserFolders(ctx.user.id);
      return folders;
    }),

    // Create a new folder
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createFolder({
          userId: ctx.user.id,
          name: input.name,
          color: input.color || null,
        });
        return { folderId: Number(result[0].insertId) };
      }),

    // Update folder
    update: protectedProcedure
      .input(z.object({
        folderId: z.number(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.color !== undefined) updates.color = input.color;
        
        await updateFolder(input.folderId, updates);
        return { success: true };
      }),

    // Delete folder
    delete: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteFolder(input.folderId);
        return { success: true };
      }),
  }),

  routes: router({
    // Create a new route
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        notes: z.string().optional(),
        waypoints: z.array(z.object({
          contactName: z.string().optional(),
          address: z.string(),
          phoneNumbers: z.string().optional(), // JSON string of phone numbers
          stopType: z.enum(["pickup", "delivery", "meeting", "visit", "other"]).optional(),
          stopColor: z.string().optional(),
        })).min(2),
        isPublic: z.boolean().default(false),
        optimizeRoute: z.boolean().default(true),
        folderId: z.number().optional(),
        startingPointAddress: z.string().optional(),
        distanceUnit: z.enum(["km", "miles"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let routeData;
        let orderedWaypoints = input.waypoints;
        
        if (input.optimizeRoute) {
          // Calculate route using Google Maps API with optimization
          routeData = await calculateRoute(
            input.waypoints.map(wp => ({
              address: wp.address,
              name: wp.contactName,
            }))
          );
        } else {
          // Calculate route without optimization (keep user order)
          routeData = await calculateRoute(
            input.waypoints.map(wp => ({
              address: wp.address,
              name: wp.contactName,
            }))
          );
        }

        // Create route record
        const shareId = nanoid(12);
        const routeResult = await createRoute({
          userId: ctx.user.id,
          name: input.name,
          notes: input.notes || null,
          shareId,
          isPublic: input.isPublic,
          totalDistance: routeData.distanceMeters,
          totalDuration: parseInt(routeData.duration.replace('s', '')),
          optimized: input.optimizeRoute,
          folderId: input.folderId || null,
          startingPointAddress: input.startingPointAddress || null,
          distanceUnit: input.distanceUnit || "km",
        });

        const routeId = Number(routeResult[0].insertId);

        // Determine waypoint order
        if (input.optimizeRoute && routeData.optimizedIntermediateWaypointIndex) {
          const optimizedOrder = routeData.optimizedIntermediateWaypointIndex;
          orderedWaypoints = [input.waypoints[0]]; // Start with origin
          
          // Add optimized intermediates
          if (optimizedOrder.length > 0) {
            const intermediates = input.waypoints.slice(1, -1);
            optimizedOrder.forEach((index: number) => {
              orderedWaypoints.push(intermediates[index]);
            });
          }
          
          orderedWaypoints.push(input.waypoints[input.waypoints.length - 1]); // Add destination
        }

        // Create waypoints with coordinates from route legs
        const waypointsToCreate = orderedWaypoints.map((wp, index) => {
          const leg = routeData.legs?.[index];
          return {
            routeId,
            position: index,
            contactName: wp.contactName || null,
            address: wp.address,
            latitude: leg?.startLocation?.latLng?.latitude?.toString() || null,
            longitude: leg?.startLocation?.latLng?.longitude?.toString() || null,
            phoneNumbers: wp.phoneNumbers || null,
            stopType: wp.stopType || "other",
            stopColor: wp.stopColor || "#3b82f6",
          };
        });

        await createRouteWaypoints(waypointsToCreate);

        return {
          routeId,
          shareId,
          totalDistance: routeData.distanceMeters,
          totalDuration: parseInt(routeData.duration.replace('s', '')),
        };
      }),

    // List user's routes
    list: protectedProcedure.query(async ({ ctx }) => {
      const routes = await getUserRoutes(ctx.user.id);
      return routes;
    }),

    // Get route details
    get: protectedProcedure
      .input(z.object({ routeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const route = await getRouteById(input.routeId);
        
        if (!route) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Route not found",
          });
        }

        if (route.userId !== ctx.user.id && !route.isPublic) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const waypoints = await getRouteWaypoints(input.routeId);
        
        return { route, waypoints };
      }),

    // Get route by share ID (public access)
    getByShareId: publicProcedure
      .input(z.object({ shareId: z.string() }))
      .query(async ({ input }) => {
        const route = await getRouteByShareId(input.shareId);
        
        if (!route) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Route not found",
          });
        }

        if (!route.isPublic) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This route is private",
          });
        }

        const waypoints = await getRouteWaypoints(route.id);
        
        return { route, waypoints };
      }),

    // Generate Google Maps URL for a route
    getGoogleMapsUrl: publicProcedure
      .input(z.object({ routeId: z.number() }))
      .query(async ({ input }) => {
        const route = await getRouteById(input.routeId);
        if (!route) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Route not found",
          });
        }

        const waypoints = await getRouteWaypoints(input.routeId);
        
        if (waypoints.length < 2) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Route must have at least 2 waypoints",
          });
        }

        const origin = encodeURIComponent(waypoints[0].address);
        const destination = encodeURIComponent(waypoints[waypoints.length - 1].address);
        const intermediates = waypoints.slice(1, -1)
          .map(wp => encodeURIComponent(wp.address))
          .join('|');

        let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
        
        if (intermediates) {
          url += `&waypoints=${intermediates}`;
        }

        return { url };
      }),

    // Delete a route
    delete: protectedProcedure
      .input(z.object({ routeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const route = await getRouteById(input.routeId);
        
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        await deleteRoute(input.routeId);
        return { success: true };
      }),

    // Move route to folder
    moveToFolder: protectedProcedure
      .input(z.object({
        routeId: z.number(),
        folderId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const route = await getRouteById(input.routeId);
        
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        await updateRoute(input.routeId, { folderId: input.folderId });
        return { success: true };
      }),

    // Get calendar authorization URL
    getCalendarAuthUrl: protectedProcedure
      .input(z.object({
        routeId: z.number(),
        startTime: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const route = await getRouteById(input.routeId);
        
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Route not found",
          });
        }

        // Store route info in state for callback
        const state = JSON.stringify({
          userId: ctx.user.id,
          routeId: input.routeId,
          startTime: input.startTime,
        });

        const redirectUri = `${ctx.req.protocol}://${ctx.req.get('host')}/api/oauth/google/calendar-callback`;
        return { url: getGoogleAuthUrl(redirectUri, state) };
      }),

    // Update waypoint status (for route execution)
    updateWaypointStatus: protectedProcedure
      .input(z.object({
        waypointId: z.number(),
        status: z.enum(["pending", "in_progress", "complete", "missed"]),
        missedReason: z.string().optional(),
        executionNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify waypoint belongs to user's route
        const waypoint = await db.select().from(routeWaypoints).where(eq(routeWaypoints.id, input.waypointId)).limit(1);
        if (!waypoint.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Waypoint not found" });
        }

        const route = await getRouteById(waypoint[0].routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        const updateData: any = {
          status: input.status,
        };

        if (input.status === "complete") {
          updateData.completedAt = new Date();
        }

        if (input.status === "missed") {
          updateData.needsReschedule = 1;
          if (input.missedReason) {
            updateData.missedReason = input.missedReason;
          }
        }

        if (input.executionNotes) {
          updateData.executionNotes = input.executionNotes;
        }

        await db.update(routeWaypoints)
          .set(updateData)
          .where(eq(routeWaypoints.id, input.waypointId));

        // Check if all waypoints are now completed or missed
        const allWaypoints = await db.select()
          .from(routeWaypoints)
          .where(eq(routeWaypoints.routeId, waypoint[0].routeId));

        const allFinished = allWaypoints.every(
          wp => wp.status === "complete" || wp.status === "missed"
        );

        // Mark route as completed if all waypoints are finished
        if (allFinished && !route.completedAt) {
          await db.update(routes)
            .set({ completedAt: new Date() })
            .where(eq(routes.id, waypoint[0].routeId));
        }

        return { success: true };
      }),

    // Update waypoint execution order
    updateWaypointOrder: protectedProcedure
      .input(z.object({
        waypointId: z.number(),
        newOrder: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify waypoint belongs to user's route
        const waypoint = await db.select().from(routeWaypoints).where(eq(routeWaypoints.id, input.waypointId)).limit(1);
        if (!waypoint.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Waypoint not found" });
        }

        const route = await getRouteById(waypoint[0].routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.update(routeWaypoints)
          .set({ executionOrder: input.newOrder })
          .where(eq(routeWaypoints.id, input.waypointId));

        return { success: true };
      }),

    // Reschedule a missed waypoint
    rescheduleWaypoint: protectedProcedure
      .input(z.object({
        waypointId: z.number(),
        rescheduledDate: z.string(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify waypoint belongs to user's route
        const waypoint = await db.select().from(routeWaypoints).where(eq(routeWaypoints.id, input.waypointId)).limit(1);
        if (!waypoint.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Waypoint not found" });
        }

        const route = await getRouteById(waypoint[0].routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.update(routeWaypoints)
          .set({ 
            rescheduledDate: new Date(input.rescheduledDate),
            needsReschedule: 0,
          })
          .where(eq(routeWaypoints.id, input.waypointId));

        return { success: true };
      }),

    // Generate share token for route (allows public access)
    generateShareToken: protectedProcedure
      .input(z.object({ routeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify route ownership
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to share this route",
          });
        }

        // Generate UUID v4 share token
        const shareToken = crypto.randomUUID();

        // Update route with share token
        await db.update(routes)
          .set({
            shareToken,
            isPubliclyAccessible: true,
            sharedAt: new Date(),
          })
          .where(eq(routes.id, input.routeId));

        return { shareToken };
      }),

    // Revoke share token (disable public access)
    revokeShareToken: protectedProcedure
      .input(z.object({ routeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify route ownership
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to modify this route",
          });
        }

        // Clear share token
        await db.update(routes)
          .set({
            shareToken: null,
            isPubliclyAccessible: false,
          })
          .where(eq(routes.id, input.routeId));

        return { success: true };
      }),

    // Get route by share token (public access - no auth required)
    getByShareToken: publicProcedure
      .input(z.object({ shareToken: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Find route by share token
        const result = await db.select()
          .from(routes)
          .where(eq(routes.shareToken, input.shareToken))
          .limit(1);

        if (result.length === 0 || !result[0].isPubliclyAccessible) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Route not found or no longer shared",
          });
        }

        const route = result[0];
        const waypoints = await getRouteWaypoints(route.id);

        return { route, waypoints };
      }),

    // Update waypoint status via share token (public access)
    updateWaypointStatusPublic: publicProcedure
      .input(z.object({
        shareToken: z.string(),
        waypointId: z.number(),
        status: z.enum(["pending", "in_progress", "complete", "missed"]),
        missedReason: z.string().optional(),
        executionNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify share token and route access
        const result = await db.select()
          .from(routes)
          .where(eq(routes.shareToken, input.shareToken))
          .limit(1);

        if (result.length === 0 || !result[0].isPubliclyAccessible) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid or expired share link",
          });
        }

        const route = result[0];

        // Verify waypoint belongs to this route
        const waypoint = await db.select()
          .from(routeWaypoints)
          .where(eq(routeWaypoints.id, input.waypointId))
          .limit(1);

        if (waypoint.length === 0 || waypoint[0].routeId !== route.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Waypoint not found",
          });
        }

        // Update waypoint status
        const updateData: any = {
          status: input.status,
        };

        if (input.status === "complete") {
          updateData.completedAt = new Date();
        }

        if (input.status === "missed") {
          updateData.missedReason = input.missedReason || null;
          updateData.needsReschedule = 1;
        }

        if (input.executionNotes) {
          updateData.executionNotes = input.executionNotes;
        }

        await db.update(routeWaypoints)
          .set(updateData)
          .where(eq(routeWaypoints.id, input.waypointId));

        return { success: true };
      }),

    // Reschedule waypoint via share token (public access)
    rescheduleWaypointPublic: publicProcedure
      .input(z.object({
        shareToken: z.string(),
        waypointId: z.number(),
        rescheduledDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify share token and route access
        const result = await db.select()
          .from(routes)
          .where(eq(routes.shareToken, input.shareToken))
          .limit(1);

        if (result.length === 0 || !result[0].isPubliclyAccessible) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid or expired share link",
          });
        }

        const route = result[0];

        // Verify waypoint belongs to this route
        const waypoint = await db.select()
          .from(routeWaypoints)
          .where(eq(routeWaypoints.id, input.waypointId))
          .limit(1);

        if (waypoint.length === 0 || waypoint[0].routeId !== route.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Waypoint not found",
          });
        }

        // Update waypoint with reschedule date
        await db.update(routeWaypoints)
          .set({
            rescheduledDate: new Date(input.rescheduledDate),
            needsReschedule: 0,
          })
          .where(eq(routeWaypoints.id, input.waypointId));

        return { success: true };
      }),

    // Add waypoint to existing route
    addWaypoint: protectedProcedure
      .input(z.object({
        routeId: z.number(),
        contactName: z.string().optional(),
        address: z.string(),
        phoneNumbers: z.string().optional(),
        stopType: z.enum(["pickup", "delivery", "meeting", "visit", "other"]).optional(),
        stopColor: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify route ownership
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        // Get current waypoints to determine order
        const existingWaypoints = await getRouteWaypoints(input.routeId);
        const nextOrder = existingWaypoints.length;

        // Insert new waypoint
        await db.insert(routeWaypoints).values({
          routeId: input.routeId,
          contactName: input.contactName || null,
          address: input.address,
          phoneNumbers: input.phoneNumbers || null,
          stopType: input.stopType || "visit",
          stopColor: input.stopColor || "#3b82f6",
          position: nextOrder,
          executionOrder: nextOrder,
          status: "pending",
        });

        return { success: true };
      }),

    // Remove waypoint from route
    removeWaypoint: protectedProcedure
      .input(z.object({
        waypointId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify waypoint belongs to user's route
        const waypoint = await db.select().from(routeWaypoints).where(eq(routeWaypoints.id, input.waypointId)).limit(1);
        if (!waypoint.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Waypoint not found" });
        }

        const route = await getRouteById(waypoint[0].routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        // Delete waypoint
        await db.delete(routeWaypoints).where(eq(routeWaypoints.id, input.waypointId));

        return { success: true };
      }),

    // Update waypoint address
    updateWaypointAddress: protectedProcedure
      .input(z.object({
        waypointId: z.number(),
        address: z.string(),
        contactName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify waypoint belongs to user's route
        const waypoint = await db.select().from(routeWaypoints).where(eq(routeWaypoints.id, input.waypointId)).limit(1);
        if (!waypoint.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Waypoint not found" });
        }

        const route = await getRouteById(waypoint[0].routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        // Update waypoint
        const updateData: any = { address: input.address };
        if (input.contactName !== undefined) {
          updateData.contactName = input.contactName;
        }

        await db.update(routeWaypoints)
          .set(updateData)
          .where(eq(routeWaypoints.id, input.waypointId));

        return { success: true };
      }),

    // Copy route
    copyRoute: protectedProcedure
      .input(z.object({
        routeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get original route
        const originalRoute = await getRouteById(input.routeId);
        if (!originalRoute || originalRoute.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        // Create new route
        const shareId = nanoid(12);
        const newRoute = await createRoute({
          userId: ctx.user.id,
          name: `${originalRoute.name} (Copy)`,
          shareId,
          totalDistance: originalRoute.totalDistance,
          totalDuration: originalRoute.totalDuration,
          notes: originalRoute.notes,
          isPublic: false,
          optimized: originalRoute.optimized,
          folderId: originalRoute.folderId,
        });

        const newRouteId = Number(newRoute[0].insertId);

        // Get original waypoints
        const originalWaypoints = await db.select()
          .from(routeWaypoints)
          .where(eq(routeWaypoints.routeId, input.routeId))
          .orderBy(routeWaypoints.position);

        // Copy waypoints
        for (const wp of originalWaypoints) {
          await db.insert(routeWaypoints).values({
            routeId: newRouteId,
            contactName: wp.contactName,
            address: wp.address,
            latitude: wp.latitude,
            longitude: wp.longitude,
            phoneNumbers: wp.phoneNumbers,
            position: wp.position,
            status: "pending", // Reset status
            stopType: wp.stopType,
          });
        }

        return { routeId: newRouteId };
      }),

    // Recalculate route distance and duration
    recalculateRoute: protectedProcedure
      .input(z.object({
        routeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get route and verify ownership
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        // Get current waypoints
        const waypoints = await db.select()
          .from(routeWaypoints)
          .where(eq(routeWaypoints.routeId, input.routeId))
          .orderBy(routeWaypoints.position);

        if (waypoints.length < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Route must have at least 2 waypoints" });
        }

        // Recalculate using Google Maps API
        const routeData = await calculateRoute(
          waypoints.map(wp => ({
            address: wp.address,
            name: wp.contactName || undefined,
          }))
        );

        // Update route with new distance and duration
        await db.update(routes)
          .set({
            totalDistance: routeData.distanceMeters,
            totalDuration: parseInt(routeData.duration.replace('s', '')),
          })
          .where(eq(routes.id, input.routeId));

        return {
          totalDistance: routeData.distanceMeters,
          totalDuration: parseInt(routeData.duration.replace('s', '')),
        };
      }),

    // Get all missed waypoints that need rescheduling (for manager dashboard)
    getMissedWaypoints: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get all routes for this user
        const userRoutes = await db.select().from(routes).where(eq(routes.userId, ctx.user.id));
        const routeIds = userRoutes.map(r => r.id);

        if (routeIds.length === 0) {
          return [];
        }

        // Get all missed waypoints from user's routes
        const missedWaypoints = await db.select()
          .from(routeWaypoints)
          .where(eq(routeWaypoints.status, "missed"));

        // Filter to only include waypoints from user's routes and join with route info
        const result = [];
        for (const wp of missedWaypoints) {
          const route = userRoutes.find(r => r.id === wp.routeId);
          if (route) {
            result.push({
              ...wp,
              routeName: route.name,
              routeId: route.id,
            });
          }
        }

        return result;
      }),
  }),

  settings: router({
    updatePreferredCallingService: protectedProcedure
      .input(z.object({
        service: z.enum(["phone", "google-voice", "whatsapp", "skype", "facetime"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        await db.update(users)
          .set({ preferredCallingService: input.service })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),
    
    updatePreferences: protectedProcedure
      .input(z.object({
        preferredCallingService: z.enum(["phone", "google-voice", "whatsapp", "skype", "facetime"]).optional(),
        distanceUnit: z.enum(["km", "miles"]).optional(),
        defaultStartingPoint: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const updateData: any = {};
        if (input.preferredCallingService) updateData.preferredCallingService = input.preferredCallingService;
        if (input.distanceUnit) updateData.distanceUnit = input.distanceUnit;
        if (input.defaultStartingPoint !== undefined) updateData.defaultStartingPoint = input.defaultStartingPoint || null;

        await db.update(users)
          .set(updateData)
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),

    // Saved starting points management
    listStartingPoints: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const points = await db.select()
          .from(savedStartingPoints)
          .where(eq(savedStartingPoints.userId, ctx.user.id));

        return points;
      }),

    createStartingPoint: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        address: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        await db.insert(savedStartingPoints).values({
          userId: ctx.user.id,
          name: input.name,
          address: input.address,
        });

        return { success: true };
      }),

    deleteStartingPoint: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify ownership
        const point = await db.select()
          .from(savedStartingPoints)
          .where(eq(savedStartingPoints.id, input.id))
          .limit(1);

        if (!point.length || point[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.delete(savedStartingPoints)
          .where(eq(savedStartingPoints.id, input.id));

        return { success: true };
      }),
  }),

  stopTypes: router({    // Get user's stop types
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const userStopTypes = await db
        .select()
        .from(stopTypes)
        .where(eq(stopTypes.userId, ctx.user.id));
      
      return userStopTypes;
    }),

    // Create new stop type
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db.insert(stopTypes).values({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
          isDefault: false,
        });
        
        return { success: true };
      }),

    // Update stop type
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .update(stopTypes)
          .set({ name: input.name, color: input.color })
          .where(eq(stopTypes.id, input.id));
        
        return { success: true };
      }),

    // Delete stop type
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .delete(stopTypes)
          .where(eq(stopTypes.id, input.id));
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
