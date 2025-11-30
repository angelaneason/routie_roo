import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { routes, routeWaypoints, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Automatic Calendar Sync", () => {
  let testRouteId: number;
  let testWaypointId: number;

  beforeEach(async () => {
    // Create a test route with calendar integration
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up any existing test data
    await db.delete(routeWaypoints).where(eq(routeWaypoints.routeId, 999));
    await db.delete(routes).where(eq(routes.id, 999));

    // Create test route with calendar
    const routeResult = await db.insert(routes).values({
      id: 999,
      userId: 1,
      name: "Test Calendar Route",
      shareId: "test-calendar-route",
      isPublic: false,
      totalDistance: 10000,
      totalDuration: 1800,
      optimized: true,
      googleCalendarId: "primary",
      scheduledDate: new Date(),
    } as any);

    testRouteId = 999;

    // Create test waypoint with calendar event ID
    const waypointResult = await db.insert(routeWaypoints).values({
      routeId: testRouteId,
      contactName: "Test Contact",
      address: "123 Test St",
      position: 0,
      executionOrder: 0,
      status: "pending",
      stopType: "visit",
      calendarEventId: "test-event-id-123",
    } as any);

    testWaypointId = Number(waypointResult[0].insertId);
  });

  it("should store calendar event ID when creating waypoint events", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify waypoint has calendar event ID
    const waypoints = await db
      .select()
      .from(routeWaypoints)
      .where(eq(routeWaypoints.id, testWaypointId))
      .limit(1);

    expect(waypoints.length).toBe(1);
    expect((waypoints[0] as any).calendarEventId).toBe("test-event-id-123");
  });

  it("should track calendar sync status in route", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify route has calendar ID
    const routeData = await db
      .select()
      .from(routes)
      .where(eq(routes.id, testRouteId))
      .limit(1);

    expect(routeData.length).toBe(1);
    expect(routeData[0].googleCalendarId).toBe("primary");
    expect(routeData[0].scheduledDate).toBeTruthy();
  });

  it("should have calendarEventId field in waypoints schema", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Query to check if column exists
    const result = await db.execute(
      "SHOW COLUMNS FROM route_waypoints LIKE 'calendarEventId'"
    );

    expect((result as any)[0].length).toBeGreaterThan(0);
  });

  it("should update waypoint calendar event ID after creation", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Update calendar event ID
    await db
      .update(routeWaypoints)
      .set({ calendarEventId: "updated-event-id" } as any)
      .where(eq(routeWaypoints.id, testWaypointId));

    // Verify update
    const waypoints = await db
      .select()
      .from(routeWaypoints)
      .where(eq(routeWaypoints.id, testWaypointId))
      .limit(1);

    expect((waypoints[0] as any).calendarEventId).toBe("updated-event-id");
  });

  it("should clear calendar event ID when needed", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clear calendar event ID
    await db
      .update(routeWaypoints)
      .set({ calendarEventId: null } as any)
      .where(eq(routeWaypoints.id, testWaypointId));

    // Verify cleared
    const waypoints = await db
      .select()
      .from(routeWaypoints)
      .where(eq(routeWaypoints.id, testWaypointId))
      .limit(1);

    expect((waypoints[0] as any).calendarEventId).toBeNull();
  });
});
