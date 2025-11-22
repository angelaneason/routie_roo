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
  clearUserCachedContacts
} from "./db";
import { 
  getGoogleAuthUrl, 
  exchangeCodeForToken, 
  fetchGoogleContacts, 
  parseGoogleContacts 
} from "./googleAuth";
import { TRPCError } from "@trpc/server";
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
    requestBody.optimizeWaypointOrder = true;
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
          
          // Parse and filter contacts with addresses
          const parsedContacts = parseGoogleContacts(googleContacts);
          
          // Clear old cached contacts
          await clearUserCachedContacts(input.userId);
          
          // Cache new contacts
          const contactsToCache = parsedContacts.map(contact => ({
            userId: input.userId,
            resourceName: contact.resourceName,
            name: contact.name,
            email: contact.email,
            address: contact.address,
            addressType: contact.addressType,
            lastSynced: new Date(),
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
  }),

  routes: router({
    // Create a new route
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        waypoints: z.array(z.object({
          contactName: z.string().optional(),
          address: z.string(),
        })).min(2),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        // Calculate route using Google Maps API
        const routeData = await calculateRoute(
          input.waypoints.map(wp => ({
            address: wp.address,
            name: wp.contactName,
          }))
        );

        // Create route record
        const shareId = nanoid(12);
        const routeResult = await createRoute({
          userId: ctx.user.id,
          name: input.name,
          shareId,
          isPublic: input.isPublic,
          totalDistance: routeData.distanceMeters,
          totalDuration: parseInt(routeData.duration.replace('s', '')),
          optimized: true,
        });

        const routeId = Number(routeResult[0].insertId);

        // Determine optimized waypoint order
        const optimizedOrder = routeData.optimizedIntermediateWaypointIndex || [];
        const orderedWaypoints = [input.waypoints[0]]; // Start with origin
        
        // Add optimized intermediates
        if (optimizedOrder.length > 0) {
          const intermediates = input.waypoints.slice(1, -1);
          optimizedOrder.forEach((index: number) => {
            orderedWaypoints.push(intermediates[index]);
          });
        }
        
        orderedWaypoints.push(input.waypoints[input.waypoints.length - 1]); // Add destination

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
  }),
});

export type AppRouter = typeof appRouter;
