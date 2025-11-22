import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createRoute, createRouteWaypoints, getRouteById, getRouteWaypoints } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { host: "test.example.com" },
      get: (header: string) => {
        if (header === "host") return "test.example.com";
        return undefined;
      },
    } as any,
    res: {} as TrpcContext["res"],
  };
}

describe("Routes API", () => {
  it("should generate Google Auth URL with correct parameters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.getGoogleAuthUrl();

    expect(result.url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(result.url).toContain("client_id=");
    expect(result.url).toContain("redirect_uri=");
    expect(result.url).toContain("scope=");
    expect(result.url).toContain("contacts");
    expect(result.url).toContain("state=1"); // User ID
  });

  it("should list user contacts from database", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const contacts = await caller.contacts.list();

    expect(Array.isArray(contacts)).toBe(true);
    // Contacts array may be empty if no contacts synced yet
  });

  it("should list user routes from database", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const routes = await caller.routes.list();

    expect(Array.isArray(routes)).toBe(true);
  });

  it("should generate Google Maps URL for waypoints", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a test route manually in the database
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Test Route",
      shareId: `test-share-${Date.now()}`,
      isPublic: true,
      totalDistance: 10000,
      totalDuration: 600,
      optimized: true,
    });

    const routeId = Number(routeResult[0].insertId);

    // Add waypoints
    await createRouteWaypoints([
      {
        routeId,
        position: 0,
        contactName: "Start Point",
        address: "123 Start St, City, State",
        latitude: "37.7749",
        longitude: "-122.4194",
      },
      {
        routeId,
        position: 1,
        contactName: "End Point",
        address: "456 End Ave, City, State",
        latitude: "37.7849",
        longitude: "-122.4094",
      },
    ]);

    // Test Google Maps URL generation
    const result = await caller.routes.getGoogleMapsUrl({ routeId });

    expect(result.url).toContain("https://www.google.com/maps/dir/");
    expect(result.url).toContain("api=1");
    expect(result.url).toContain("origin=");
    expect(result.url).toContain("destination=");
    expect(result.url).toContain("travelmode=driving");
  });

  it("should retrieve route by ID with waypoints", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test route
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Test Retrieve Route",
      shareId: `test-retrieve-${Date.now()}`,
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 300,
      optimized: true,
    });

    const routeId = Number(routeResult[0].insertId);

    // Add waypoints
    await createRouteWaypoints([
      {
        routeId,
        position: 0,
        contactName: "Location A",
        address: "789 Location A St",
        latitude: "37.7749",
        longitude: "-122.4194",
      },
    ]);

    // Retrieve the route
    const result = await caller.routes.get({ routeId });

    expect(result.route).toBeDefined();
    expect(result.route.id).toBe(routeId);
    expect(result.route.name).toBe("Test Retrieve Route");
    expect(result.waypoints).toBeDefined();
    expect(result.waypoints.length).toBeGreaterThan(0);
  });
});

describe("Route Notes Feature", () => {
  it("should allow creating routes with notes", async () => {
    const ctx = createAuthContext();
    const routeWithNotes = {
      userId: ctx.user!.id,
      name: "Route with Notes",
      notes: "This is a test note for the route",
      shareId: `test-notes-${Date.now()}`,
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 300,
      optimized: true,
    };

    const result = await createRoute(routeWithNotes);
    const routeId = Number(result[0].insertId);
    
    const retrieved = await getRouteById(routeId);
    expect(retrieved?.notes).toBe("This is a test note for the route");
  });

  it("should allow routes without notes", async () => {
    const ctx = createAuthContext();
    const routeWithoutNotes = {
      userId: ctx.user!.id,
      name: "Route without Notes",
      shareId: `test-no-notes-${Date.now()}`,
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 300,
      optimized: true,
    };

    const result = await createRoute(routeWithoutNotes);
    const routeId = Number(result[0].insertId);
    
    const retrieved = await getRouteById(routeId);
    expect(retrieved?.notes).toBeNull();
  });
});

describe("Stop Types Feature", () => {
  it("should store stop type and color for waypoints", async () => {
    const ctx = createAuthContext();
    
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Route with Stop Types",
      shareId: `test-stop-types-${Date.now()}`,
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 300,
      optimized: true,
    });

    const routeId = Number(routeResult[0].insertId);

    await createRouteWaypoints([
      {
        routeId,
        position: 0,
        address: "123 Pickup St",
        stopType: "pickup",
        stopColor: "#10b981",
      },
      {
        routeId,
        position: 1,
        address: "456 Delivery Ave",
        stopType: "delivery",
        stopColor: "#f59e0b",
      },
    ]);

    const waypoints = await getRouteWaypoints(routeId);
    expect(waypoints[0].stopType).toBe("pickup");
    expect(waypoints[0].stopColor).toBe("#10b981");
    expect(waypoints[1].stopType).toBe("delivery");
    expect(waypoints[1].stopColor).toBe("#f59e0b");
  });

  it("should use default stop type if not specified", async () => {
    const ctx = createAuthContext();
    
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Route with Default Stop Type",
      shareId: `test-default-stop-${Date.now()}`,
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 300,
      optimized: true,
    });

    const routeId = Number(routeResult[0].insertId);

    await createRouteWaypoints([
      {
        routeId,
        position: 0,
        address: "123 Default St",
      },
    ]);

    const waypoints = await getRouteWaypoints(routeId);
    // Should have default values from schema
    expect(waypoints[0].stopType).toBeDefined();
    expect(waypoints[0].stopColor).toBeDefined();
  });
});

describe("Calendar Integration", () => {
  it("should generate calendar auth URL with route info", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test route first
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Calendar Test Route",
      shareId: `test-calendar-${Date.now()}`,
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 300,
      optimized: true,
    });

    const routeId = Number(routeResult[0].insertId);

    const startTime = new Date().toISOString();
    const result = await caller.routes.getCalendarAuthUrl({
      routeId,
      startTime,
    });

    expect(result.url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(result.url).toContain("scope=");
    expect(result.url).toContain("calendar");
  });

  it("should reject calendar auth for non-existent route", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.routes.getCalendarAuthUrl({
        routeId: 999999,
        startTime: new Date().toISOString(),
      });
      expect.fail("Should have thrown NOT_FOUND error");
    } catch (error: any) {
      expect(error.code).toBe("NOT_FOUND");
    }
  });
});
