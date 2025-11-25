import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
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
  fetchContactGroupNames,
  parseGoogleContacts,
  createCalendarEvent,
  getCalendarList
} from "./googleAuth";
import { TRPCError } from "@trpc/server";
import { users, routes, routeWaypoints, stopTypes, savedStartingPoints, routeNotes, InsertRoute } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
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
      // Use public URL from ENV to avoid internal Azure container address
      const redirectUri = `${ENV.publicUrl}/api/oauth/google/callback`;
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
          
          // Fetch contact group names first
          const groupNameMap = await fetchContactGroupNames(tokenData.access_token);
          console.log('Fetched contact groups:', Array.from(groupNameMap.entries()));
          
          // Fetch contacts
          const googleContacts = await fetchGoogleContacts(tokenData.access_token);
          
          // Parse all contacts (including those without addresses), resolving group IDs to names
          const parsedContacts = parseGoogleContacts(googleContacts, groupNameMap);
          
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
      // Use public URL from ENV to avoid internal Azure container address
      const redirectUri = `${ENV.publicUrl}/api/oauth/google/callback`;
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

    // Import contacts from CSV
    importFromCSV: protectedProcedure
      .input(z.object({
        contacts: z.array(z.object({
          name: z.string(),
          email: z.string().optional(),
          address: z.string(),
          phoneNumbers: z.array(z.object({
            value: z.string(),
            label: z.string(),
          })).optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { cachedContacts } = await import("../drizzle/schema");
        
        // Validate addresses using Google Maps Geocoding
        const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
        if (!GOOGLE_MAPS_API_KEY) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Google Maps API key not configured",
          });
        }

        const validatedContacts = [];
        const errors = [];

        for (let i = 0; i < input.contacts.length; i++) {
          const contact = input.contacts[i];
          
          try {
            // Validate address using Geocoding API
            const geocodeResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(contact.address)}&key=${GOOGLE_MAPS_API_KEY}`
            );
            
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData.status === "OK" && geocodeData.results.length > 0) {
              validatedContacts.push({
                userId: ctx.user.id,
                name: contact.name,
                email: contact.email || null,
                address: geocodeData.results[0].formatted_address, // Use validated address
                phoneNumbers: contact.phoneNumbers ? JSON.stringify(contact.phoneNumbers) : null,
                googleResourceName: null,
                photoUrl: null,
                labels: null,
                isActive: 1,
              });
            } else {
              errors.push({ row: i + 1, name: contact.name, error: "Invalid address" });
            }
          } catch (error) {
            errors.push({ row: i + 1, name: contact.name, error: "Geocoding failed" });
          }
        }

        // Insert validated contacts
        if (validatedContacts.length > 0) {
          await upsertCachedContacts(validatedContacts);
        }

        return {
          success: true,
          imported: validatedContacts.length,
          failed: errors.length,
          errors,
        };
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
          contactLabels: z.string().optional(), // JSON string of contact labels
          stopType: z.enum(["pickup", "delivery", "meeting", "visit", "other"]).optional(),
          stopColor: z.string().optional(),
        })).min(2),
        isPublic: z.boolean().default(false),
        optimizeRoute: z.boolean().default(true),
        folderId: z.number().optional(),
        startingPointAddress: z.string().optional(),
        distanceUnit: z.enum(["km", "miles"]).optional(),
        scheduledDate: z.string().optional(),
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
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
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
            contactLabels: wp.contactLabels || null,
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

    // List user's routes (excludes archived by default)
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserRoutes(ctx.user.id);
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

    // Update route properties
    update: protectedProcedure
      .input(z.object({
        routeId: z.number(),
        name: z.string().min(1).optional(),
        notes: z.string().optional(),
        folderId: z.number().nullable().optional(),
        startingPointAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const route = await getRouteById(input.routeId);
        
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const updates: Partial<InsertRoute> = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.notes !== undefined) updates.notes = input.notes;
        if (input.folderId !== undefined) updates.folderId = input.folderId;
        if (input.startingPointAddress !== undefined) updates.startingPointAddress = input.startingPointAddress;

        await updateRoute(input.routeId, updates);
        return { success: true };
      }),

    // Clear calendar event tracking from route
    clearCalendarEvents: protectedProcedure
      .input(z.object({
        routeId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const route = await getRouteById(input.routeId);
        
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        // Clear the calendar tracking fields
        await updateRoute(input.routeId, {
          googleCalendarId: null,
        });
        
        return { success: true };
      }),

    // Create individual calendar events for each waypoint
    createWaypointEvents: protectedProcedure
      .input(z.object({
        routeId: z.number(),
        calendarId: z.string(),
        startTime: z.string(),
        accessToken: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const route = await getRouteById(input.routeId);
        
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Route not found",
          });
        }

        const waypoints = await getRouteWaypoints(input.routeId);
        const startDate = new Date(input.startTime);
        let currentTime = startDate.getTime();
        
        // Get user's default stop duration (default to 30 minutes if not set)
        const userStopDurationMinutes = ctx.user.defaultStopDuration || 30;
        const stopDuration = userStopDurationMinutes * 60 * 1000; // Convert to milliseconds
        
        // Get user's event duration mode (default to stop_only)
        const eventDurationMode = ctx.user.eventDurationMode || 'stop_only';
        
        // Calculate travel time per segment (rough estimate)
        const travelTimePerSegment = (route.totalDuration! * 1000) / waypoints.length;
        
        const createdEvents = [];

        // Create individual event for each waypoint
        for (let i = 0; i < waypoints.length; i++) {
          const wp = waypoints[i];
          const isLast = i === waypoints.length - 1;
          
          let eventStart: Date;
          let eventEnd: Date;
          
          if (eventDurationMode === 'include_drive') {
            // Mode: Include drive time in event
            // Event starts at current time (includes drive to this location)
            // Event ends after stop duration
            eventStart = new Date(currentTime);
            eventEnd = new Date(currentTime + stopDuration + (i > 0 ? travelTimePerSegment : 0));
          } else {
            // Mode: Stop time only (default)
            // Event shows just the time at the location
            // Drive time is added between events
            eventStart = new Date(currentTime);
            eventEnd = new Date(currentTime + stopDuration);
          }
          
          try {
            const { eventId, htmlLink } = await createCalendarEvent(
              input.accessToken,
              {
                summary: `${route.name} - Stop ${i + 1}: ${wp.contactName || 'Waypoint'}`,
                description: `Address: ${wp.address}${wp.phoneNumbers ? `\nPhone: ${wp.phoneNumbers}` : ''}${wp.executionNotes ? `\nNotes: ${wp.executionNotes}` : ''}`,
                start: eventStart.toISOString(),
                end: eventEnd.toISOString(),
                location: wp.address,
              },
              input.calendarId
            );
            
            createdEvents.push({ waypointId: wp.id, eventId, htmlLink });
          } catch (error) {
            console.error(`Failed to create event for waypoint ${wp.id}:`, error);
          }
          
          // Move to next time slot
          if (!isLast) {
            if (eventDurationMode === 'include_drive') {
              // Next event starts right after this one ends
              currentTime = eventEnd.getTime();
            } else {
              // Add travel time between events
              currentTime = eventEnd.getTime() + travelTimePerSegment;
            }
          }
        }

        // Update route with scheduled info
        const db = await getDb();
        if (db) {
          await db.update(routes)
            .set({
              scheduledDate: startDate,
              googleCalendarId: input.calendarId,
            })
            .where(eq(routes.id, input.routeId));
        }

        return {
          success: true,
          eventsCreated: createdEvents.length,
          events: createdEvents,
        };
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

        // Use public URL from ENV to avoid internal Azure container address
        const redirectUri = `${ENV.publicUrl}/api/oauth/google/calendar-callback`;
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

    // Re-optimize route by finding best positions for new stops
    reoptimizeRoute: protectedProcedure
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

        // Get all waypoints
        const allWaypoints = await db.select()
          .from(routeWaypoints)
          .where(eq(routeWaypoints.routeId, input.routeId))
          .orderBy(routeWaypoints.position);

        if (allWaypoints.length < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Route must have at least 2 waypoints" });
        }

        // Identify "new" stops: waypoints added after route creation
        const routeCreatedAt = new Date(route.createdAt);
        const newStops = allWaypoints.filter(wp => new Date(wp.createdAt) > routeCreatedAt);
        const existingStops = allWaypoints.filter(wp => new Date(wp.createdAt) <= routeCreatedAt);

        if (newStops.length === 0) {
          return { message: "No new stops to optimize", optimizedCount: 0 };
        }

        // For each new stop, find the best insertion position
        let currentOrder = [...existingStops];
        
        for (const newStop of newStops) {
          let bestPosition = currentOrder.length; // Default: append at end
          let bestDistance = Infinity;

          // Try inserting at each position
          for (let i = 1; i < currentOrder.length; i++) { // Start at 1 to skip origin
            const testOrder = [
              ...currentOrder.slice(0, i),
              newStop,
              ...currentOrder.slice(i)
            ];

            try {
              // Calculate route distance with this order
              const routeData = await calculateRoute(
                testOrder.map(wp => ({
                  address: wp.address,
                  name: wp.contactName || undefined,
                }))
              );

              if (routeData.distanceMeters < bestDistance) {
                bestDistance = routeData.distanceMeters;
                bestPosition = i;
              }
            } catch (error) {
              // Skip this position if route calculation fails
              continue;
            }
          }

          // Insert at best position
          currentOrder = [
            ...currentOrder.slice(0, bestPosition),
            newStop,
            ...currentOrder.slice(bestPosition)
          ];
        }

        // Update waypoint positions in database
        for (let i = 0; i < currentOrder.length; i++) {
          await db.update(routeWaypoints)
            .set({ position: i })
            .where(eq(routeWaypoints.id, currentOrder[i].id));
        }

        // Recalculate final route distance and duration
        const finalRouteData = await calculateRoute(
          currentOrder.map(wp => ({
            address: wp.address,
            name: wp.contactName || undefined,
          }))
        );

        await db.update(routes)
          .set({
            totalDistance: finalRouteData.distanceMeters,
            totalDuration: parseInt(finalRouteData.duration.replace('s', '')),
          })
          .where(eq(routes.id, input.routeId));

        return {
          message: `Optimized ${newStops.length} new stop(s)`,
          optimizedCount: newStops.length,
          totalDistance: finalRouteData.distanceMeters,
          totalDuration: parseInt(finalRouteData.duration.replace('s', '')),
        };
      }),

    // Archive a route
    archiveRoute: protectedProcedure
      .input(z.object({ routeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify route ownership
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.update(routes)
          .set({ 
            isArchived: true, 
            archivedAt: new Date() 
          })
          .where(eq(routes.id, input.routeId));

        return { success: true };
      }),

    // Unarchive a route
    unarchiveRoute: protectedProcedure
      .input(z.object({ routeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify route ownership
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.update(routes)
          .set({ 
            isArchived: false, 
            archivedAt: null 
          })
          .where(eq(routes.id, input.routeId));

        return { success: true };
      }),

    // Get archived routes
    getArchivedRoutes: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const archivedRoutes = await db.select({
          id: routes.id,
          userId: routes.userId,
          name: routes.name,
          shareId: routes.shareId,
          isPublic: routes.isPublic,
          totalDistance: routes.totalDistance,
          totalDuration: routes.totalDuration,
          optimized: routes.optimized,
          folderId: routes.folderId,
          calendarId: routes.calendarId,
          scheduledDate: routes.scheduledDate,
          shareToken: routes.shareToken,
          completedAt: routes.completedAt,
          isArchived: routes.isArchived,
          archivedAt: routes.archivedAt,
          distanceUnit: routes.distanceUnit,
          notes: routes.notes,
          createdAt: routes.createdAt,
          updatedAt: routes.updatedAt,
          waypointCount: sql<number>`(SELECT COUNT(*) FROM route_waypoints WHERE route_waypoints.routeId = routes.id)`,
          completedWaypointCount: sql<number>`(SELECT COUNT(*) FROM route_waypoints WHERE route_waypoints.routeId = routes.id AND route_waypoints.status = 'complete')`
        })
          .from(routes)
          .where(and(
            eq(routes.userId, ctx.user.id),
            eq(routes.isArchived, true)
          ));

        return archivedRoutes;
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

    // Add note to route
    addNote: protectedProcedure
      .input(z.object({
        routeId: z.number(),
        note: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify route belongs to user
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
        }

        await db.insert(routeNotes).values({
          routeId: input.routeId,
          userId: ctx.user.id,
          note: input.note,
        });

        return { success: true };
      }),

    // Get notes for a route
    getNotes: protectedProcedure
      .input(z.object({
        routeId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify route belongs to user
        const route = await getRouteById(input.routeId);
        if (!route || route.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
        }

        const notes = await db.select()
          .from(routeNotes)
          .where(eq(routeNotes.routeId, input.routeId))
          .orderBy(desc(routeNotes.createdAt));

        return notes;
      }),

    // Update note
    updateNote: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        note: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify note belongs to user
        const [note] = await db.select()
          .from(routeNotes)
          .where(eq(routeNotes.id, input.noteId));

        if (!note || note.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
        }

        await db.update(routeNotes)
          .set({ note: input.note })
          .where(eq(routeNotes.id, input.noteId));

        return { success: true };
      }),

    // Delete note
    deleteNote: protectedProcedure
      .input(z.object({
        noteId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify note belongs to user
        const [note] = await db.select()
          .from(routeNotes)
          .where(eq(routeNotes.id, input.noteId));

        if (!note || note.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
        }

        await db.delete(routeNotes)
          .where(eq(routeNotes.id, input.noteId));

        return { success: true };
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
    
    // Get Google Calendar connection URL
    getCalendarConnectionUrl: protectedProcedure
      .mutation(async ({ ctx }) => {
        const state = JSON.stringify({
          userId: ctx.user.id,
          action: 'calendar',
        });

        const redirectUri = `${ENV.publicUrl}/api/oauth/google/callback`;
        const { getGoogleAuthUrl } = await import('./googleAuth');
        return { url: getGoogleAuthUrl(redirectUri, state) };
      }),

    // Disconnect Google Calendar
    disconnectCalendar: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        await db.update(users)
          .set({
            googleCalendarAccessToken: null,
            googleCalendarRefreshToken: null,
            googleCalendarTokenExpiry: null,
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),

    updatePreferences: protectedProcedure
      .input(z.object({
        preferredCallingService: z.enum(["phone", "google-voice", "whatsapp", "skype", "facetime"]).optional(),
        distanceUnit: z.enum(["km", "miles"]).optional(),
        defaultStartingPoint: z.string().optional(),
        defaultStopDuration: z.number().optional(), // Stop duration in minutes
        eventDurationMode: z.enum(["stop_only", "include_drive"]).optional(), // Calendar event duration mode
        autoArchiveDays: z.number().nullable().optional(), // null = never auto-archive
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const updateData: any = {};
        if (input.preferredCallingService) updateData.preferredCallingService = input.preferredCallingService;
        if (input.distanceUnit) updateData.distanceUnit = input.distanceUnit;
        if (input.defaultStartingPoint !== undefined) updateData.defaultStartingPoint = input.defaultStartingPoint;
        if (input.defaultStopDuration !== undefined) updateData.defaultStopDuration = input.defaultStopDuration;
        if (input.eventDurationMode !== undefined) updateData.eventDurationMode = input.eventDurationMode;
        if (input.autoArchiveDays !== undefined) updateData.autoArchiveDays = input.autoArchiveDays;

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

    updateStartingPoint: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        address: z.string().min(1),
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

        await db.update(savedStartingPoints)
          .set({
            name: input.name,
            address: input.address,
          })
          .where(eq(savedStartingPoints.id, input.id));

        return { success: true };
      }),
  }),

  calendar: router({
    // Get calendar events for a specific month
    getEvents: protectedProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get first and last day of the month
        const firstDay = new Date(input.year, input.month - 1, 1);
        const lastDay = new Date(input.year, input.month, 0, 23, 59, 59);
        
        const allEvents: any[] = [];
        
        // Get all routes scheduled in this month
        const scheduledRoutes = await db
          .select()
          .from(routes)
          .where(
            and(
              eq(routes.userId, ctx.user.id),
              sql`${routes.scheduledDate} >= ${firstDay}`,
              sql`${routes.scheduledDate} <= ${lastDay}`
            )
          );
        
        // Convert routes to calendar events
        scheduledRoutes.forEach(route => {
          allEvents.push({
            id: `route-${route.id}`,
            routeId: route.id,
            summary: route.name,
            start: route.scheduledDate?.toISOString() || '',
            end: route.scheduledDate ? new Date(route.scheduledDate.getTime() + (route.totalDuration || 0) * 1000).toISOString() : '',
            type: 'route',
            color: '#3b82f6', // Blue for routes
          });
        });
        
        // Fetch Google Calendar events if user has connected their calendar
        if (ctx.user.googleCalendarAccessToken) {
          try {
            let accessToken = ctx.user.googleCalendarAccessToken;
            
            // Check if token is expired and refresh if needed
            if (ctx.user.googleCalendarTokenExpiry && ctx.user.googleCalendarRefreshToken) {
              const isExpired = new Date(ctx.user.googleCalendarTokenExpiry) < new Date();
              
              if (isExpired) {
                console.log('[Calendar] Access token expired, refreshing...');
                const { refreshAccessToken } = await import('./googleAuth');
                const newToken = await refreshAccessToken(ctx.user.googleCalendarRefreshToken);
                
                // Update token in database
                const expiryDate = new Date(Date.now() + newToken.expires_in * 1000);
                await db.update(users)
                  .set({
                    googleCalendarAccessToken: newToken.access_token,
                    googleCalendarTokenExpiry: expiryDate,
                  })
                  .where(eq(users.id, ctx.user.id));
                
                accessToken = newToken.access_token;
                console.log('[Calendar] Token refreshed successfully');
              }
            }
            
            const { getAllCalendarEvents } = await import('./googleAuth');
            const googleEvents = await getAllCalendarEvents(
              accessToken,
              firstDay.toISOString(),
              lastDay.toISOString()
            );
            
            // Add Google Calendar events
            googleEvents.forEach(event => {
              allEvents.push({
                id: `google-${event.id}`,
                summary: event.summary,
                description: event.description,
                start: event.start,
                end: event.end,
                location: event.location,
                type: 'google',
                color: '#6b7280', // Gray for other Google events
                htmlLink: event.htmlLink,
                calendarName: event.calendarName,
              });
            });
          } catch (error) {
            console.error('[Calendar] Failed to fetch Google Calendar events:', error);
            // Continue without Google Calendar events
          }
        }
        
        // Sort by start time
        return allEvents.sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        );
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
