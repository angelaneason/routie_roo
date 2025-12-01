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
  getUserByOpenId,
  deleteRoute,
  updateRoute,
  createFolder,
  getUserFolders,
  updateFolder,
  deleteFolder,
  createImportantDateType,
  getUserImportantDateTypes,
  updateImportantDateType,
  deleteImportantDateType,
  createCommentOption,
  getUserCommentOptions,
  updateCommentOption,
  deleteCommentOption
} from "./db";
import { 
  getGoogleAuthUrl, 
  exchangeCodeForToken, 
  fetchGoogleContacts, 
  fetchContactGroupNames,
  parseGoogleContacts,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarList
} from "./googleAuth";
import { TRPCError } from "@trpc/server";
import { validateAddress } from "./addressValidation";
import { users, routes, routeWaypoints, stopTypes, savedStartingPoints, routeNotes, InsertRoute, cachedContacts, rescheduleHistory } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Helper to calculate route using Google Maps Routes API
async function calculateRoute(waypoints: Array<{ address: string; name?: string }>, optimize: boolean = false) {
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
    // Set optimizeWaypointOrder if optimization is requested
    if (optimize) {
      requestBody.optimizeWaypointOrder = true;
    }
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
      const state = JSON.stringify({
        userId: ctx.user.id,
        action: 'contacts',
      });
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
          
          // Store OAuth tokens for Google Contacts sync
          const db = await getDb();
          if (db && tokenData.refresh_token) {
            const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000);
            await db.update(users)
              .set({
                googleContactsAccessToken: tokenData.access_token,
                googleContactsRefreshToken: tokenData.refresh_token,
                googleContactsTokenExpiry: expiryDate,
              } as any) // Type assertion for new fields
              .where(eq(users.id, input.userId));
            console.log('[Google Contacts] OAuth tokens stored for sync');
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
      const state = JSON.stringify({
        userId: ctx.user.id,
        action: 'contacts',
      });
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
        importantDates: z.array(z.object({
          type: z.string(),
          date: z.string(),
        })).optional(),
        comments: z.array(z.object({
          option: z.string(),
          customText: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const { cachedContacts } = await import("../drizzle/schema");
        
        // Get current contact to check if address changed
        const currentContact = await db.select().from(cachedContacts)
          .where(eq(cachedContacts.id, input.contactId))
          .limit(1);
        
        if (!currentContact.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
        }
        
        const updateData: any = {
          name: input.name,
          email: input.email,
          address: input.address,
          phoneNumbers: JSON.stringify(input.phoneNumbers),
          updatedAt: new Date(),
        };
        
        // Track address changes
        const oldAddress = currentContact[0].address;
        const newAddress = input.address;
        
        // If this is the first time we're tracking the original address, save it
        if (!currentContact[0].originalAddress && oldAddress) {
          updateData.originalAddress = oldAddress;
        }
        
        // If address changed from original, mark as modified
        const originalAddress = currentContact[0].originalAddress || oldAddress;
        if (originalAddress && newAddress && originalAddress !== newAddress) {
          updateData.addressModified = 1;
          updateData.addressModifiedAt = new Date();
        } else if (originalAddress === newAddress) {
          // If address was changed back to original, clear modified flag
          updateData.addressModified = 0;
          updateData.addressModifiedAt = null;
        }
        
        if (input.importantDates !== undefined) {
          updateData.importantDates = JSON.stringify(input.importantDates);
        }
        
        if (input.comments !== undefined) {
          updateData.comments = JSON.stringify(input.comments);
        }
        
        await db.update(cachedContacts)
          .set(updateData)
          .where(eq(cachedContacts.id, input.contactId));

        // Sync to Google Contact if googleResourceName exists
        if (currentContact[0].googleResourceName) {
          const { syncToGoogleContact } = await import("./googleContactSync");
          const syncResult = await syncToGoogleContact({
            contactId: input.contactId,
            userId: ctx.user.id,
            address: input.address,
            phoneNumbers: JSON.stringify(input.phoneNumbers),
          });
          
          if (!syncResult.success) {
            console.warn('[Kangaroo Crew] Failed to sync contact to Google:', syncResult.error);
            // Don't fail the mutation - contact update succeeded
          } else {
            console.log('[Kangaroo Crew] Successfully synced contact to Google');
          }
        }

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

    // Validate address using Google Maps Geocoding API
    validateAddress: protectedProcedure
      .input(z.object({
        address: z.string(),
      }))
      .mutation(async ({ input }) => {        const result = await validateAddress(input.address);
        return result;
      }),
    
    // Get contacts with modified addresses
    getChangedAddresses: protectedProcedure.query(async ({ ctx }) => {
      const { getChangedAddresses } = await import("./changedAddresses");
      return await getChangedAddresses(ctx.user.id);
    }),
    
    // Mark a contact's address as synced
    markAddressSynced: protectedProcedure
      .input(z.object({
        contactId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { markAddressSynced } = await import("./changedAddresses");
        return await markAddressSynced(input.contactId, ctx.user.id);
      }),
    
    // Mark all contacts' addresses as synced
    markAllAddressesSynced: protectedProcedure.mutation(async ({ ctx }) => {
      const { markAllAddressesSynced } = await import("./changedAddresses");
      return await markAllAddressesSynced(ctx.user.id);
    }),
    
    // Upload document for a contact
    uploadDocument: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file data
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { uploadContactDocument } = await import("./documents");
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        return await uploadContactDocument({
          contactId: input.contactId,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileBuffer,
          mimeType: input.mimeType,
        });
      }),
    
    // Get documents for a contact
    getDocuments: protectedProcedure
      .input(z.object({
        contactId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const { getContactDocuments } = await import("./documents");
        return await getContactDocuments(input.contactId, ctx.user.id);
      }),
    
    // Delete a document
    deleteDocument: protectedProcedure
      .input(z.object({
        documentId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { deleteContactDocument } = await import("./documents");
        return await deleteContactDocument(input.documentId, ctx.user.id);
      }),
    
    // Get contacts by label
    getContactsByLabel: protectedProcedure
      .input(z.object({
        label: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { getContactsByLabel } = await import("./documents");
        return await getContactsByLabel(ctx.user.id, input.label);
      }),
    
    // Bulk upload document to multiple contacts
    bulkUploadDocument: protectedProcedure
      .input(z.object({
        contactIds: z.array(z.number()),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file data
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { bulkUploadDocument } = await import("./documents");
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        return await bulkUploadDocument({
          contactIds: input.contactIds,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileBuffer,
          mimeType: input.mimeType,
        });
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
          contactId: z.number().optional(), // cachedContacts ID for Google sync
          contactName: z.string().optional(),
          address: z.string(),
          phoneNumbers: z.string().optional(), // JSON string of phone numbers
          photoUrl: z.string().optional(), // Contact photo URL
          contactLabels: z.string().optional(), // JSON string of contact labels
          importantDates: z.string().optional(), // JSON string of important dates
          comments: z.string().optional(), // JSON string of comments
          stopType: z.string().optional(), // Accept any custom stop type name
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
        
        // Calculate route using Google Maps API
        routeData = await calculateRoute(
          input.waypoints.map(wp => ({
            address: wp.address,
            name: wp.contactName,
          })),
          input.optimizeRoute // Pass optimization flag
        );

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
            contactId: wp.contactId || null,
            position: index,
            contactName: wp.contactName || null,
            address: wp.address,
            latitude: leg?.startLocation?.latLng?.latitude?.toString() || null,
            longitude: leg?.startLocation?.latLng?.longitude?.toString() || null,
            phoneNumbers: wp.phoneNumbers || null,
            photoUrl: wp.photoUrl || null,
            contactLabels: wp.contactLabels || null,
            importantDates: wp.importantDates || null,
            comments: wp.comments || null,
            stopType: wp.stopType || "other",
            stopColor: wp.stopColor || "#3b82f6",
          };
        });

        await createRouteWaypoints(waypointsToCreate as any); // Type assertion for custom stop types

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

    // Clear calendar event tracking from route and delete events from Google Calendar
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

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Get waypoints with calendar event IDs
        const waypoints = await getRouteWaypoints(input.routeId);
        const waypointsWithEvents = waypoints.filter(wp => (wp as any).calendarEventId);

        // Delete events from Google Calendar if user has calendar connected
        if (route.googleCalendarId && waypointsWithEvents.length > 0) {
          // Get user's calendar access token
          const userResult = await db.select()
            .from(users)
            .where(eq(users.id, ctx.user.id))
            .limit(1);

          const user = userResult[0];
          if (user?.googleCalendarAccessToken) {
            let accessToken = user.googleCalendarAccessToken;

            // Check if token is expired and refresh if needed
            if (user.googleCalendarTokenExpiry && user.googleCalendarRefreshToken) {
              const isExpired = new Date(user.googleCalendarTokenExpiry) < new Date();
              if (isExpired) {
                const { refreshAccessToken } = await import('./googleAuth');
                const newToken = await refreshAccessToken(user.googleCalendarRefreshToken);
                accessToken = newToken.access_token;

                // Update token in database
                const expiryDate = new Date(Date.now() + newToken.expires_in * 1000);
                await db.update(users)
                  .set({
                    googleCalendarAccessToken: newToken.access_token,
                    googleCalendarTokenExpiry: expiryDate,
                  })
                  .where(eq(users.id, ctx.user.id));
              }
            }

            // Delete each event from Google Calendar
            let deletedCount = 0;
            for (const wp of waypointsWithEvents) {
              const eventId = (wp as any).calendarEventId;
              try {
                await deleteCalendarEvent(accessToken, eventId, route.googleCalendarId);
                deletedCount++;
                console.log(`[Calendar] Deleted event ${eventId} for waypoint ${wp.id}`);
              } catch (error) {
                console.warn(`[Calendar] Failed to delete event ${eventId}:`, error);
                // Continue deleting other events even if one fails
              }
            }

            console.log(`[Calendar] Deleted ${deletedCount}/${waypointsWithEvents.length} events from Google Calendar`);
          }
        }

        // Clear calendar event IDs from all waypoints
        for (const wp of waypoints) {
          await db.update(routeWaypoints)
            .set({ calendarEventId: null } as any)
            .where(eq(routeWaypoints.id, wp.id));
        }

        // Clear the calendar tracking fields from route
        await updateRoute(input.routeId, {
          googleCalendarId: null,
          scheduledDate: null,
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
        const db = await getDb();

        // Create individual event for each waypoint (skip starting point)
        for (let i = 0; i < waypoints.length; i++) {
          const wp = waypoints[i];
          
          // Skip starting point (position 0 is always the anchor/starting point)
          if (wp.position === 0) {
            continue;
          }
          
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
          
          // Format stop type for display (capitalize first letter)
          const stopTypeDisplay = wp.stopType 
            ? wp.stopType.charAt(0).toUpperCase() + wp.stopType.slice(1)
            : 'Stop';
          
          try {
            const { eventId, htmlLink } = await createCalendarEvent(
              input.accessToken,
              {
                summary: `${stopTypeDisplay}: ${wp.contactName || 'Waypoint'}`,
                description: `Address: ${wp.address}${wp.phoneNumbers ? `\nPhone: ${wp.phoneNumbers}` : ''}${wp.executionNotes ? `\nNotes: ${wp.executionNotes}` : ''}`,
                start: eventStart.toISOString(),
                end: eventEnd.toISOString(),
                location: wp.address,
              },
              input.calendarId
            );
            
            createdEvents.push({ waypointId: wp.id, eventId, htmlLink });
            
            // Store event ID in waypoint for future updates
            if (db) {
              await db.update(routeWaypoints)
                .set({ calendarEventId: eventId } as any)
                .where(eq(routeWaypoints.id, wp.id));
            }
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

        // Log to reschedule history
        await db.insert(rescheduleHistory).values({
          userId: ctx.user.id,
          waypointId: input.waypointId,
          routeId: waypoint[0].routeId,
          routeName: route.name,
          contactName: waypoint[0].contactName || 'Unknown',
          address: waypoint[0].address,
          originalDate: route.scheduledDate,
          rescheduledDate: new Date(input.rescheduledDate),
          missedReason: waypoint[0].missedReason,
          status: 'pending',
        });

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
        stopType: z.string().optional(), // Accept any custom stop type name
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
        const insertResult = await db.insert(routeWaypoints).values({
          routeId: input.routeId,
          contactName: input.contactName || null,
          address: input.address,
          phoneNumbers: input.phoneNumbers || null,
          stopType: input.stopType || "visit",
          stopColor: input.stopColor || "#3b82f6",
          position: nextOrder,
          executionOrder: nextOrder,
          status: "pending",
        } as any); // Type assertion for custom stop types
        
        const newWaypointId = Number(insertResult[0].insertId);
        
        // If route has calendar events, create calendar event for new waypoint
        if (route.googleCalendarId && route.scheduledDate) {
          try {
            // Get user's calendar access token
            const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
            if (user.length && user[0].googleCalendarAccessToken) {
              let accessToken = user[0].googleCalendarAccessToken;
              
              // Check if token expired and refresh if needed
              if (user[0].googleCalendarTokenExpiry && new Date(user[0].googleCalendarTokenExpiry) < new Date()) {
                if (user[0].googleCalendarRefreshToken) {
                  const { refreshAccessToken } = await import("./googleAuth");
                  const refreshed = await refreshAccessToken(user[0].googleCalendarRefreshToken);
                  accessToken = refreshed.access_token;
                  
                  // Update stored token
                  await db.update(users)
                    .set({
                      googleCalendarAccessToken: accessToken,
                      googleCalendarTokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
                    })
                    .where(eq(users.id, ctx.user.id));
                }
              }
              
              // Create calendar event for new waypoint
              const stopTypeDisplay = input.stopType 
                ? input.stopType.charAt(0).toUpperCase() + input.stopType.slice(1)
                : 'Visit';
              
              // Calculate event time based on position (rough estimate)
              const userStopDurationMinutes = user[0].defaultStopDuration || 30;
              const stopDuration = userStopDurationMinutes * 60 * 1000;
              const travelTimePerSegment = (route.totalDuration! * 1000) / (existingWaypoints.length + 1);
              
              const startTime = new Date(route.scheduledDate).getTime() + (nextOrder * (stopDuration + travelTimePerSegment));
              const endTime = startTime + stopDuration;
              
              const { eventId } = await createCalendarEvent(
                accessToken,
                {
                  summary: `${stopTypeDisplay}: ${input.contactName || 'Waypoint'}`,
                  description: `Address: ${input.address}${input.phoneNumbers ? `\nPhone: ${input.phoneNumbers}` : ''}`,
                  start: new Date(startTime).toISOString(),
                  end: new Date(endTime).toISOString(),
                  location: input.address,
                },
                route.googleCalendarId
              );
              
              // Store event ID in waypoint
              await db.update(routeWaypoints)
                .set({ calendarEventId: eventId } as any)
                .where(eq(routeWaypoints.id, newWaypointId));
              
              console.log(`[Calendar Sync] Created event ${eventId} for new waypoint`);
            }
          } catch (error) {
            console.warn("[Calendar Sync] Failed to create calendar event for new waypoint:", error);
            // Don't fail the mutation - waypoint was created successfully
          }
        }

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
        
        // Delete calendar event if it exists
        const waypointWithEventId = waypoint[0] as any;
        if (route.googleCalendarId && waypointWithEventId.calendarEventId) {
          try {
            // Get user's calendar access token
            const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
            if (user.length && user[0].googleCalendarAccessToken) {
              let accessToken = user[0].googleCalendarAccessToken;
              
              // Check if token expired and refresh if needed
              if (user[0].googleCalendarTokenExpiry && new Date(user[0].googleCalendarTokenExpiry) < new Date()) {
                if (user[0].googleCalendarRefreshToken) {
                  const { refreshAccessToken } = await import("./googleAuth");
                  const refreshed = await refreshAccessToken(user[0].googleCalendarRefreshToken);
                  accessToken = refreshed.access_token;
                  
                  // Update stored token
                  await db.update(users)
                    .set({
                      googleCalendarAccessToken: accessToken,
                      googleCalendarTokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
                    })
                    .where(eq(users.id, ctx.user.id));
                }
              }
              
              // Delete calendar event
              await deleteCalendarEvent(
                accessToken,
                waypointWithEventId.calendarEventId,
                route.googleCalendarId
              );
              
              console.log(`[Calendar Sync] Deleted event ${waypointWithEventId.calendarEventId}`);
            }
          } catch (error) {
            console.warn("[Calendar Sync] Failed to delete calendar event:", error);
            // Don't fail the mutation - we'll still delete the waypoint
          }
        }

        // Delete waypoint
        await db.delete(routeWaypoints).where(eq(routeWaypoints.id, input.waypointId));

        return { success: true };
      }),

    // Reorder waypoints
    reorderWaypoints: protectedProcedure
      .input(z.object({
        updates: z.array(z.object({
          waypointId: z.number(),
          position: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify all waypoints belong to user's routes
        for (const update of input.updates) {
          const waypoint = await db.select().from(routeWaypoints).where(eq(routeWaypoints.id, update.waypointId)).limit(1);
          if (!waypoint.length) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Waypoint not found" });
          }

          const route = await getRouteById(waypoint[0].routeId);
          if (!route || route.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
          }

          // Update waypoint position
          await db.update(routeWaypoints)
            .set({ position: update.position })
            .where(eq(routeWaypoints.id, update.waypointId));
        }

        // Mark route as having manual order
        if (input.updates.length > 0) {
          const firstWaypoint = await db.select().from(routeWaypoints).where(eq(routeWaypoints.id, input.updates[0].waypointId)).limit(1);
          if (firstWaypoint.length) {
            await db.update(routes)
              .set({ hasManualOrder: true })
              .where(eq(routes.id, firstWaypoint[0].routeId));
          }
        }

        return { success: true };
      }),

    // Update waypoint details (stop type, contact name, etc.)
    updateWaypointDetails: protectedProcedure
      .input(z.object({
        waypointId: z.number(),
        contactName: z.string().optional(),
        stopType: z.string().optional(),
        stopColor: z.string().optional(),
        address: z.string().optional(),
        phoneNumbers: z.string().optional(), // JSON string
        contactLabels: z.string().optional(), // JSON string
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

        // Build update object for waypoint
        const updateData: any = {};
        if (input.contactName !== undefined) updateData.contactName = input.contactName;
        if (input.stopType !== undefined) updateData.stopType = input.stopType;
        if (input.stopColor !== undefined) updateData.stopColor = input.stopColor;
        if (input.address !== undefined) updateData.address = input.address;
        if (input.phoneNumbers !== undefined) updateData.phoneNumbers = input.phoneNumbers;
        if (input.contactLabels !== undefined) updateData.contactLabels = input.contactLabels;

        // Update waypoint in database
        await db.update(routeWaypoints)
          .set(updateData as any)
          .where(eq(routeWaypoints.id, input.waypointId));

        // Sync to Google Contact if contactId exists and relevant fields changed
        const updatedWaypoint = waypoint[0] as any; // Type assertion for contactId field
        if (updatedWaypoint.contactId && (input.address || input.phoneNumbers || input.contactLabels)) {
          const { syncToGoogleContact } = await import("./googleContactSync");
          const syncResult = await syncToGoogleContact({
            contactId: updatedWaypoint.contactId,
            userId: ctx.user.id,
            address: input.address,
            phoneNumbers: input.phoneNumbers,
            contactLabels: input.contactLabels,
          });
          
          if (!syncResult.success) {
            console.warn("[Google Sync] Failed to sync waypoint changes:", syncResult.error);
            // Don't fail the mutation - waypoint update succeeded
          }
        }
        
        // Sync to Google Calendar if route has calendar events and relevant fields changed
        if (route.googleCalendarId && updatedWaypoint.calendarEventId && (input.contactName || input.stopType || input.address)) {
          try {
            // Get fresh access token
            const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
            if (user.length && user[0].googleCalendarAccessToken) {
              let accessToken = user[0].googleCalendarAccessToken;
              
              // Check if token expired and refresh if needed
              if (user[0].googleCalendarTokenExpiry && new Date(user[0].googleCalendarTokenExpiry) < new Date()) {
                if (user[0].googleCalendarRefreshToken) {
                  const { refreshAccessToken } = await import("./googleAuth");
                  const refreshed = await refreshAccessToken(user[0].googleCalendarRefreshToken);
                  accessToken = refreshed.access_token;
                  
                  // Update stored token
                  await db.update(users)
                    .set({
                      googleCalendarAccessToken: accessToken,
                      googleCalendarTokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
                    })
                    .where(eq(users.id, ctx.user.id));
                }
              }
              
              // Update calendar event
              const stopTypeDisplay = input.stopType 
                ? input.stopType.charAt(0).toUpperCase() + input.stopType.slice(1)
                : updatedWaypoint.stopType
                ? updatedWaypoint.stopType.charAt(0).toUpperCase() + updatedWaypoint.stopType.slice(1)
                : 'Stop';
              
              await updateCalendarEvent(
                accessToken,
                updatedWaypoint.calendarEventId,
                {
                  summary: `${stopTypeDisplay}: ${input.contactName || updatedWaypoint.contactName || 'Waypoint'}`,
                  location: input.address || updatedWaypoint.address,
                },
                route.googleCalendarId
              );
              
              console.log(`[Calendar Sync] Updated event ${updatedWaypoint.calendarEventId}`);
            }
          } catch (error) {
            console.warn("[Calendar Sync] Failed to update calendar event:", error);
            // Don't fail the mutation - waypoint update succeeded
          }
        }

        return { success: true };
      }),

    // Update waypoint address
    updateWaypointAddress: protectedProcedure
      .input(z.object({
        waypointId: z.number(),
        address: z.string(),
        contactName: z.string().optional(),
        updateContact: z.boolean().optional(),
        contactId: z.number().optional(),
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

        // If user wants to update contact address permanently
        if (input.updateContact && input.contactId) {
          // Get current contact to check if address changed
          const currentContact = await db.select().from(cachedContacts)
            .where(and(
              eq(cachedContacts.id, input.contactId),
              eq(cachedContacts.userId, ctx.user.id)
            ))
            .limit(1);
          
          if (currentContact.length) {
            const contactUpdateData: any = { address: input.address };
            const oldAddress = currentContact[0].address;
            const newAddress = input.address;
            
            // If this is the first time we're tracking the original address, save it
            if (!currentContact[0].originalAddress && oldAddress) {
              contactUpdateData.originalAddress = oldAddress;
            }
            
            // If address changed from original, mark as modified
            const originalAddress = currentContact[0].originalAddress || oldAddress;
            if (originalAddress && newAddress && originalAddress !== newAddress) {
              contactUpdateData.addressModified = 1;
              contactUpdateData.addressModifiedAt = new Date();
            } else if (originalAddress === newAddress) {
              // If address was changed back to original, clear modified flag
              contactUpdateData.addressModified = 0;
              contactUpdateData.addressModifiedAt = null;
            }
            
            await db.update(cachedContacts)
              .set(contactUpdateData)
              .where(and(
                eq(cachedContacts.id, input.contactId),
                eq(cachedContacts.userId, ctx.user.id)
              ));
          }
        }

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
          } as any); // Type assertion for custom stop types
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
          // No new stops - just recalculate route with current order to update map
          const currentRouteData = await calculateRoute(
            allWaypoints.map(wp => ({
              address: wp.address,
              name: wp.contactName || undefined,
            }))
          );

          // Update route distance and duration
          await db.update(routes)
            .set({
              totalDistance: currentRouteData.distanceMeters,
              totalDuration: parseInt(currentRouteData.duration.replace('s', '')),
            })
            .where(eq(routes.id, input.routeId));

          // Update waypoint coordinates from fresh route calculation
          for (let i = 0; i < allWaypoints.length; i++) {
            const leg = currentRouteData.legs?.[i];
            if (leg?.startLocation?.latLng) {
              await db.update(routeWaypoints)
                .set({
                  latitude: leg.startLocation.latLng.latitude?.toString() || null,
                  longitude: leg.startLocation.latLng.longitude?.toString() || null,
                })
                .where(eq(routeWaypoints.id, allWaypoints[i].id));
            }
          }

          return { 
            message: "Route recalculated with current order", 
            optimizedCount: 0,
            totalDistance: currentRouteData.distanceMeters,
            totalDuration: parseInt(currentRouteData.duration.replace('s', '')),
          };
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

        // Update waypoint coordinates from fresh route calculation
        for (let i = 0; i < currentOrder.length; i++) {
          const leg = finalRouteData.legs?.[i];
          if (leg?.startLocation?.latLng) {
            await db.update(routeWaypoints)
              .set({
                latitude: leg.startLocation.latLng.latitude?.toString() || null,
                longitude: leg.startLocation.latLng.longitude?.toString() || null,
              })
              .where(eq(routeWaypoints.id, currentOrder[i].id));
          }
        }

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

    // Get reschedule history
    getRescheduleHistory: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "completed", "re_missed", "cancelled"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        let query = db.select()
          .from(rescheduleHistory)
          .where(eq(rescheduleHistory.userId, ctx.user.id));

        // Filter by status if provided
        if (input?.status) {
          query = db.select()
            .from(rescheduleHistory)
            .where(
              and(
                eq(rescheduleHistory.userId, ctx.user.id),
                eq(rescheduleHistory.status, input.status)
              )
            );
        }

        const history = await query.orderBy(desc(rescheduleHistory.createdAt));
        return history;
      }),

    // Update reschedule history status
    updateRescheduleStatus: protectedProcedure
      .input(z.object({
        historyId: z.number(),
        status: z.enum(["pending", "completed", "re_missed", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify history entry belongs to user
        const history = await db.select()
          .from(rescheduleHistory)
          .where(eq(rescheduleHistory.id, input.historyId))
          .limit(1);

        if (!history.length || history[0].userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.update(rescheduleHistory)
          .set({ status: input.status })
          .where(eq(rescheduleHistory.id, input.historyId));

        return { success: true };
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
        schedulingEmail: z.string().optional(), // Email for scheduling team reminders
        enableDateReminders: z.boolean().optional(), // Enable/disable date reminders
        reminderIntervals: z.array(z.number()).optional(), // Days before dates to send reminders
        enabledReminderDateTypes: z.array(z.string()).optional(), // Date types that trigger reminders
        defaultStopType: z.string().optional(), // Default stop type for new routes
        defaultStopTypeColor: z.string().optional(), // Default stop type color
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
        if (input.schedulingEmail !== undefined) updateData.schedulingEmail = input.schedulingEmail;
        if (input.enableDateReminders !== undefined) updateData.enableDateReminders = input.enableDateReminders ? 1 : 0;
        if (input.reminderIntervals !== undefined) updateData.reminderIntervals = JSON.stringify(input.reminderIntervals);
        if (input.enabledReminderDateTypes !== undefined) updateData.enabledReminderDateTypes = JSON.stringify(input.enabledReminderDateTypes);
        if (input.defaultStopType !== undefined) updateData.defaultStopType = input.defaultStopType;
        if (input.defaultStopTypeColor !== undefined) updateData.defaultStopTypeColor = input.defaultStopTypeColor;

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

    // Important Date Types management
    listImportantDateTypes: protectedProcedure.query(async ({ ctx }) => {
      return getUserImportantDateTypes(ctx.user.id);
    }),

    createImportantDateType: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        await createImportantDateType({
          userId: ctx.user.id,
          name: input.name,
        });
        return { success: true };
      }),

    updateImportantDateType: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateImportantDateType(input.id, input.name);
        return { success: true };
      }),

    deleteImportantDateType: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await deleteImportantDateType(input.id);
        return { success: true };
      }),

    // Comment Options management
    listCommentOptions: protectedProcedure.query(async ({ ctx }) => {
      return getUserCommentOptions(ctx.user.id);
    }),

    createCommentOption: protectedProcedure
      .input(z.object({
        option: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        await createCommentOption({
          userId: ctx.user.id,
          option: input.option,
        });
        return { success: true };
      }),

    updateCommentOption: protectedProcedure
      .input(z.object({
        id: z.number(),
        option: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateCommentOption(input.id, input.option);
        return { success: true };
      }),

    deleteCommentOption: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await deleteCommentOption(input.id);
        return { success: true };
      }),
    
    // Get upcoming date reminders
    getUpcomingReminders: protectedProcedure.query(async ({ ctx }) => {
      const { getUpcomingDateReminders } = await import("./emailReminders");
      return await getUpcomingDateReminders(ctx.user.id);
    }),
    
    // Process and send all pending reminders
    processReminders: protectedProcedure.mutation(async ({ ctx }) => {
      const { processUserReminders } = await import("./emailReminders");
      return await processUserReminders(ctx.user.id);
    }),
    
    // Get reminder history for the user
    getReminderHistory: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const limit = input?.limit || 50;
        const offset = input?.offset || 0;
        
        const { reminderHistory } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        
        const history = await db.select()
          .from(reminderHistory)
          .where(eq(reminderHistory.userId, ctx.user.id))
          .orderBy(desc(reminderHistory.sentAt))
          .limit(limit)
          .offset(offset);
        
        return history;
      }),
  }),
  
  calendar: router({
    // Get user's calendar list from database (stored during OAuth)
    getCalendarList: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      // Fetch user from database to get stored calendar list
      console.log('[getCalendarList] Fetching calendar list for user ID:', ctx.user.id);
      const user = await db.select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      console.log('[getCalendarList] User found:', user.length > 0);
      if (user.length > 0) {
        console.log('[getCalendarList] User email:', user[0].email);
        console.log('[getCalendarList] googleCalendarList value:', user[0].googleCalendarList);
      }
      console.log('[getCalendarList] Has googleCalendarList:', !!user[0]?.googleCalendarList);
      
      if (!user.length || !user[0].googleCalendarList) {
        console.log('[getCalendarList] No calendar list found, returning empty array');
        return [];
      }
      
      try {
        // Parse stored calendar list JSON
        const calendars = JSON.parse(user[0].googleCalendarList);
        return calendars;
      } catch (error) {
        console.error('[Calendar] Error parsing calendar list:', error);
        return [];
      }
    }),
    
    // Update calendar visibility preferences
    updateCalendarPreferences: protectedProcedure
      .input(z.object({
        visibleCalendars: z.array(z.string()),
        defaultCalendar: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db.update(users)
          .set({
            calendarPreferences: JSON.stringify(input),
          })
          .where(eq(users.id, ctx.user.id));
        
        return { success: true };
      }),
    // Get calendar events for a specific month
    getEvents: protectedProcedure
      .input(z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
        visibleCalendars: z.array(z.string()).optional(), // Optional: filter by visible calendar IDs
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Use year and month for filtering
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
              sql`YEAR(${routes.scheduledDate}) = ${input.year}`,
              sql`MONTH(${routes.scheduledDate}) = ${input.month}`
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
        
        // Get rescheduled stops (missed waypoints with rescheduledDate)
        const rescheduledStops = await db
          .select({
            waypoint: routeWaypoints,
            route: routes,
          })
          .from(routeWaypoints)
          .innerJoin(routes, eq(routeWaypoints.routeId, routes.id))
          .where(
            and(
              eq(routes.userId, ctx.user.id),
              eq(routeWaypoints.status, 'missed'),
              sql`${routeWaypoints.rescheduledDate} IS NOT NULL`,
              sql`YEAR(${routeWaypoints.rescheduledDate}) = ${input.year}`,
              sql`MONTH(${routeWaypoints.rescheduledDate}) = ${input.month}`
            )
          );
        
        // Convert rescheduled stops to calendar events
        rescheduledStops.forEach(({ waypoint, route }) => {
          allEvents.push({
            id: `rescheduled-${waypoint.id}`,
            waypointId: waypoint.id,
            routeId: route.id,
            routeName: route.name,
            summary: `🔄 ${waypoint.contactName}`,
            description: `Rescheduled stop from route: ${route.name}`,
            start: waypoint.rescheduledDate?.toISOString() || '',
            end: waypoint.rescheduledDate ? new Date(waypoint.rescheduledDate.getTime() + 30 * 60 * 1000).toISOString() : '', // 30 min default
            location: waypoint.address,
            type: 'rescheduled',
            color: '#f59e0b', // Orange for rescheduled stops
          });
        });
        
        // Fetch Google Calendar events if user has connected their calendar
        // Get user data directly from database by ID to get calendar tokens
        const userResult = await db.select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        const freshUser = userResult.length > 0 ? userResult[0] : null;
        
        if (freshUser?.googleCalendarAccessToken) {
          try {
            let accessToken = freshUser.googleCalendarAccessToken;
            
            // Check if token is expired and refresh if needed
            if (freshUser.googleCalendarTokenExpiry && freshUser.googleCalendarRefreshToken) {
              const isExpired = new Date(freshUser.googleCalendarTokenExpiry) < new Date();
              
              if (isExpired) {
                console.log('[Calendar] Access token expired, refreshing...');
                const { refreshAccessToken } = await import('./googleAuth');
                const newToken = await refreshAccessToken(freshUser.googleCalendarRefreshToken);
                
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
              lastDay.toISOString(),
              input.visibleCalendars // Pass visible calendar IDs to filter
            );
            
            // Add Google Calendar events
            googleEvents.forEach(event => {
              allEvents.push({
                id: `google-${event.id}`,
                googleEventId: event.id, // Add original Google event ID for editing
                summary: event.summary,
                description: event.description,
                start: event.start,
                end: event.end,
                location: event.location,
                type: 'google',
                color: event.backgroundColor || '#6b7280', // Use calendar backgroundColor
                htmlLink: event.htmlLink,
                calendarId: event.calendarId, // Already present, needed for editing
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
    
    // Create a new calendar event
    createEvent: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        startDate: z.string(),
        startTime: z.string().optional(),
        endDate: z.string(),
        endTime: z.string().optional(),
        allDay: z.boolean(),
        calendarId: z.string(),
        description: z.string().optional(),
        recurrence: z.string().optional(), // RRULE format
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get user's calendar tokens
        const userResult = await db.select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        const user = userResult.length > 0 ? userResult[0] : null;
        
        if (!user?.googleCalendarAccessToken) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Google Calendar not connected" });
        }
        
        let accessToken = user.googleCalendarAccessToken;
        
        // Check if token is expired and refresh if needed
        if (user.googleCalendarTokenExpiry && user.googleCalendarRefreshToken) {
          const isExpired = new Date(user.googleCalendarTokenExpiry) < new Date();
          
          if (isExpired) {
            console.log('[Calendar] Access token expired, refreshing...');
            const { refreshAccessToken } = await import('./googleAuth');
            const newToken = await refreshAccessToken(user.googleCalendarRefreshToken);
            
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
        
        // Build event object for Google Calendar API
        const event: any = {
          summary: input.title,
          description: input.description,
        };
        
        if (input.allDay) {
          // All-day events use date format (YYYY-MM-DD)
          event.start = { date: input.startDate };
          event.end = { date: input.endDate };
        } else {
          // Timed events use dateTime format (ISO 8601)
          const startDateTime = `${input.startDate}T${input.startTime || '09:00'}:00`;
          const endDateTime = `${input.endDate}T${input.endTime || '10:00'}:00`;
          event.start = { dateTime: startDateTime, timeZone: 'America/New_York' };
          event.end = { dateTime: endDateTime, timeZone: 'America/New_York' };
        }
        
        // Add recurrence if specified
        if (input.recurrence) {
          event.recurrence = [input.recurrence];
        }
        
        // Call Google Calendar API to create event
        try {
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('[Calendar] Failed to create event:', errorData);
            throw new TRPCError({ 
              code: "INTERNAL_SERVER_ERROR", 
              message: `Failed to create calendar event: ${errorData.error?.message || 'Unknown error'}` 
            });
          }
          
          const createdEvent = await response.json();
          console.log('[Calendar] Event created successfully:', createdEvent.id);
          
          return { 
            success: true, 
            eventId: createdEvent.id,
            htmlLink: createdEvent.htmlLink 
          };
        } catch (error: any) {
          console.error('[Calendar] Error creating event:', error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: error.message || 'Failed to create calendar event' 
          });
        }
      }),
    
    // Update an existing calendar event
    updateEvent: protectedProcedure
      .input(z.object({
        eventId: z.string(),
        calendarId: z.string(),
        summary: z.string().optional(),
        description: z.string().optional(),
        start: z.string().optional(), // ISO 8601 datetime
        end: z.string().optional(), // ISO 8601 datetime
        location: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get user's calendar tokens
        const userResult = await db.select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        const user = userResult.length > 0 ? userResult[0] : null;
        
        if (!user?.googleCalendarAccessToken) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Google Calendar not connected" });
        }
        
        let accessToken = user.googleCalendarAccessToken;
        
        // Check if token is expired and refresh if needed
        if (user.googleCalendarTokenExpiry && user.googleCalendarRefreshToken) {
          const isExpired = new Date(user.googleCalendarTokenExpiry) < new Date();
          
          if (isExpired) {
            console.log('[Calendar] Access token expired, refreshing...');
            const { refreshAccessToken } = await import('./googleAuth');
            const newToken = await refreshAccessToken(user.googleCalendarRefreshToken);
            
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
        
        // Call Google Calendar API update function
        try {
          const { updateCalendarEvent } = await import('./googleAuth');
          const result = await updateCalendarEvent(
            accessToken,
            input.eventId,
            {
              summary: input.summary,
              description: input.description,
              start: input.start,
              end: input.end,
              location: input.location,
            },
            input.calendarId
          );
          
          console.log('[Calendar] Event updated successfully:', result.eventId);
          
          return { 
            success: true, 
            eventId: result.eventId,
            htmlLink: result.htmlLink 
          };
        } catch (error: any) {
          console.error('[Calendar] Error updating event:', error);
          throw new TRPCError({ 
            code: "INTERNAL_SERVER_ERROR", 
            message: error.message || 'Failed to update calendar event' 
          });
        }
      }),
  }),

  stopTypes: router({
    // Get user's stop types
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

  admin: router({
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      // Only admins can list users
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get all users with route and contact counts
      const allUsers = await db.select().from(users);

      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          const routeCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(routes)
            .where(eq(routes.userId, user.id));

          const contactCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(cachedContacts)
            .where(eq(cachedContacts.userId, user.id));

          return {
            ...user,
            routeCount: Number(routeCount[0]?.count || 0),
            contactCount: Number(contactCount[0]?.count || 0),
          };
        })
      );

      return usersWithStats;
    }),

    mergeUsers: protectedProcedure
      .input(z.object({
        sourceUserId: z.number(),
        targetUserId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admins can merge users
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Transfer routes
        await db
          .update(routes)
          .set({ userId: input.targetUserId })
          .where(eq(routes.userId, input.sourceUserId));

        // Transfer contacts
        await db
          .update(cachedContacts)
          .set({ userId: input.targetUserId })
          .where(eq(cachedContacts.userId, input.sourceUserId));

        // Transfer reschedule history
        await db
          .update(rescheduleHistory)
          .set({ userId: input.targetUserId })
          .where(eq(rescheduleHistory.userId, input.sourceUserId));

        // Transfer stop types
        await db
          .update(stopTypes)
          .set({ userId: input.targetUserId })
          .where(eq(stopTypes.userId, input.sourceUserId));

        // Delete source user
        await db
          .delete(users)
          .where(eq(users.id, input.sourceUserId));

        return { success: true };
      }),

    deleteUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admins can delete users
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }

        // Cannot delete yourself
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete your own account' });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Check if user has any data
        const routeCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(routes)
          .where(eq(routes.userId, input.userId));

        const contactCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(cachedContacts)
          .where(eq(cachedContacts.userId, input.userId));

        if (Number(routeCount[0]?.count || 0) > 0 || Number(contactCount[0]?.count || 0) > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot delete user with existing routes or contacts. Merge user first.',
          });
        }

        // Delete user
        await db
          .delete(users)
          .where(eq(users.id, input.userId));

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
