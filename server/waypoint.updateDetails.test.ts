import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the database and Google sync functions
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{
          id: 1,
          routeId: 1,
          contactId: "contact123",
          name: "Updated Name",
          address: "123 New St, City, ST 12345",
          latitude: 40.7128,
          longitude: -74.0060,
          stopType: "client",
          phoneNumbers: JSON.stringify([{ number: "555-1234", label: "work" }]),
          labels: JSON.stringify(["VIP"]),
          orderIndex: 0,
          status: "pending",
          notes: null,
          completedAt: null,
          missedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{
          id: 1,
          userId: 1,
          name: "Test Route",
          folderId: null,
          scheduledDate: null,
          startingPoint: null,
          notes: null,
          totalDistance: null,
          totalDuration: null,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
  })),
}));

vi.mock("./_core/googlePeople", () => ({
  syncToGoogleContact: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/map", () => ({
  makeRequest: vi.fn().mockResolvedValue({
    results: [{
      geometry: {
        location: {
          lat: 40.7128,
          lng: -74.0060,
        },
      },
    }],
  }),
}));

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
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
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("waypoint.updateWaypointDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates waypoint details without syncing to Google Contact when updateContact is false", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { getDb } = await import("./db");
    const mockDb = await getDb();

    const result = await caller.waypoint.updateWaypointDetails({
      waypointId: 1,
      name: "Updated Name",
      address: "123 New St, City, ST 12345",
      stopType: "client",
      phoneNumbers: [{ number: "555-1234", label: "work" }],
      labels: ["VIP"],
      updateContact: false,
      contactId: "contact123",
    });

    expect(result.success).toBe(true);
    expect(mockDb?.update).toHaveBeenCalled();
    
    const { syncToGoogleContact } = await import("./_core/googlePeople");
    expect(syncToGoogleContact).not.toHaveBeenCalled();
  });

  it("updates waypoint details and syncs to Google Contact when updateContact is true", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { getDb } = await import("./db");
    const mockDb = await getDb();

    const result = await caller.waypoint.updateWaypointDetails({
      waypointId: 1,
      name: "Updated Name",
      address: "123 New St, City, ST 12345",
      stopType: "client",
      phoneNumbers: [{ number: "555-1234", label: "work" }],
      labels: ["VIP"],
      updateContact: true,
      contactId: "contact123",
    });

    expect(result.success).toBe(true);
    expect(mockDb?.update).toHaveBeenCalled();
    
    const { syncToGoogleContact } = await import("./_core/googlePeople");
    expect(syncToGoogleContact).toHaveBeenCalledWith(
      ctx.user,
      "contact123",
      expect.objectContaining({
        name: "Updated Name",
        address: "123 New St, City, ST 12345",
        phoneNumbers: [{ number: "555-1234", label: "work" }],
      })
    );
  });

  it("geocodes address when address is provided and updateContact is true", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.waypoint.updateWaypointDetails({
      waypointId: 1,
      name: "Updated Name",
      address: "123 New St, City, ST 12345",
      stopType: "client",
      phoneNumbers: [],
      labels: [],
      updateContact: true,
      contactId: "contact123",
    });

    const { makeRequest } = await import("./_core/map");
    expect(makeRequest).toHaveBeenCalledWith(
      "/maps/api/geocode/json",
      expect.objectContaining({
        address: "123 New St, City, ST 12345",
      })
    );
  });

  it("does not sync to Google Contact when contactId is not provided", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.waypoint.updateWaypointDetails({
      waypointId: 1,
      name: "Updated Name",
      address: "123 New St, City, ST 12345",
      stopType: "client",
      phoneNumbers: [],
      labels: [],
      updateContact: true,
      // contactId not provided
    });

    expect(result.success).toBe(true);
    
    const { syncToGoogleContact } = await import("./_core/googlePeople");
    expect(syncToGoogleContact).not.toHaveBeenCalled();
  });
});
