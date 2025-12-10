import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "admin",
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

describe("Per-Visit Billing System", () => {
  let routeId: number;
  let waypointId: number;
  let clientId: number;
  let routeHolderId: number;

  beforeAll(async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a route holder (contact)
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert a test contact to use as route holder
    const { cachedContacts } = await import("../drizzle/schema");
    const contactResult = await db.insert(cachedContacts).values({
      userId: 1,
      googleResourceName: 'test-contact-123',
      name: 'Test Route Holder',
      email: 'holder@test.com',
      address: '123 Main St',
    });
    // Result is an array [ResultSetHeader, undefined]
    routeHolderId = Number((contactResult as any)[0]?.insertId);
    console.log('Contact insert result:', contactResult);
    console.log('Route holder ID:', routeHolderId);
    
    if (isNaN(routeHolderId) || routeHolderId === 0) {
      throw new Error(`Failed to get valid routeHolderId. Got: ${routeHolderId}, result: ${JSON.stringify(contactResult)}`);
    }

    // Create a client for billing
    const clientResult = await caller.billing.clients.create({
      routeHolderId,
      clientName: "Test Client",
      billingModel: "per_visit",
      flatFeeAmount: 2500, // $25.00 per visit
    });
    clientId = clientResult.id;

    // Create a route with the route holder (need at least 2 waypoints)
    const routeResult = await caller.routes.create({
      name: "Test Route for Billing",
      waypoints: [
        {
          contactId: routeHolderId,
          contactName: "Test Route Holder",
          address: "123 Main St",
          lat: 40.7128,
          lng: -74.0060,
          stopType: "Home Visit",
        },
        {
          contactId: routeHolderId,
          contactName: "Test Route Holder 2",
          address: "456 Oak Ave",
          lat: 40.7130,
          lng: -74.0062,
          stopType: "Follow-up",
        },
      ],
      routeHolderId,
    });
    routeId = routeResult.routeId;

    // Get the waypoint ID
    const route = await caller.routes.get({ routeId });
    waypointId = route.waypoints[0].id;
  });

  it("should create a billing record when a waypoint is completed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Complete the waypoint
    await caller.routes.updateWaypointStatus({
      waypointId,
      status: "complete",
    });

    // Check that a billing record was created
    const billingRecords = await caller.billing.records.list();
    
    expect(billingRecords.length).toBeGreaterThan(0);
    
    const record = billingRecords.find(r => r.waypointId === waypointId);
    expect(record).toBeDefined();
    expect(record?.contactName).toBe("Test Route Holder");
    expect(record?.visitType).toBe("Home Visit");
    expect(record?.billingModel).toBe("per_visit");
    expect(record?.calculatedAmount).toBe(2500); // $25.00
    expect(record?.routeId).toBe(routeId);
    expect(record?.clientId).toBe(clientId);
  });

  it("should create separate billing records for each completed waypoint", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a route with multiple waypoints
    const multiRouteResult = await caller.routes.create({
      name: "Multi-Stop Route",
      waypoints: [
        {
          contactId: routeHolderId,
          contactName: "Stop 1",
          address: "123 Main St",
          lat: 40.7128,
          lng: -74.0060,
          stopType: "Delivery",
        },
        {
          contactId: routeHolderId,
          contactName: "Stop 2",
          address: "456 Oak Ave",
          lat: 40.7130,
          lng: -74.0062,
          stopType: "Pickup",
        },
      ],
      routeHolderId,
    });

    const multiRoute = await caller.routes.get({ routeId: multiRouteResult.routeId });
    const waypoint1Id = multiRoute.waypoints[0].id;
    const waypoint2Id = multiRoute.waypoints[1].id;

    // Get initial billing record count
    const initialRecords = await caller.billing.records.list();
    const initialCount = initialRecords.length;

    // Complete first waypoint
    await caller.routes.updateWaypointStatus({
      waypointId: waypoint1Id,
      status: "complete",
    });

    // Check that one billing record was created
    let records = await caller.billing.records.list();
    expect(records.length).toBe(initialCount + 1);

    // Complete second waypoint
    await caller.routes.updateWaypointStatus({
      waypointId: waypoint2Id,
      status: "complete",
    });

    // Check that another billing record was created
    records = await caller.billing.records.list();
    expect(records.length).toBe(initialCount + 2);

    // Verify both records have correct data
    const record1 = records.find(r => r.waypointId === waypoint1Id);
    const record2 = records.find(r => r.waypointId === waypoint2Id);

    expect(record1?.contactName).toBe("Stop 1");
    expect(record1?.visitType).toBe("Delivery");
    expect(record2?.contactName).toBe("Stop 2");
    expect(record2?.visitType).toBe("Pickup");
  });

  it("should not create billing records for missed waypoints", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a route
    const routeResult = await caller.routes.create({
      name: "Route with Missed Stop",
      waypoints: [
        {
          contactId: routeHolderId,
          contactName: "Missed Stop",
          address: "789 Elm St",
          lat: 40.7132,
          lng: -74.0064,
          stopType: "Visit",
        },
      ],
      routeHolderId,
    });

    const route = await caller.routes.get({ routeId: routeResult.routeId });
    const waypointId = route.waypoints[0].id;

    const initialRecords = await caller.billing.records.list();
    const initialCount = initialRecords.length;

    // Mark waypoint as missed
    await caller.routes.updateWaypointStatus({
      waypointId,
      status: "missed",
      missedReason: "Client not home",
    });

    // Verify no new billing record was created
    const records = await caller.billing.records.list();
    expect(records.length).toBe(initialCount);
  });
});
