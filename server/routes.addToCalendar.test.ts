import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the googleAuth module
vi.mock("./googleAuth", () => ({
  createCalendarEvent: vi.fn(async (accessToken: string, event: any, calendarId: string) => ({
    eventId: `mock-event-${Date.now()}`,
    htmlLink: "https://calendar.google.com/event?eid=mock",
  })),
}));

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [
            {
              id: 1,
              defaultStopDuration: 30,
              eventDurationMode: "stop_only",
            },
          ]),
          orderBy: vi.fn(() => [
            {
              id: 1,
              position: 0,
              isGapStop: false,
              contactName: "Starting Point",
              address: "123 Start St",
              stopType: "Start",
              durationToHere: 0,
            },
            {
              id: 2,
              position: 1,
              isGapStop: false,
              contactName: "John Doe",
              address: "456 Main St",
              stopType: "Visit",
              durationToHere: 600, // 10 minutes
            },
            {
              id: 3,
              position: 2,
              isGapStop: false,
              contactName: "Jane Smith",
              address: "789 Oak Ave",
              stopType: "Delivery",
              durationToHere: 900, // 15 minutes
            },
          ]),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  })),
  getRouteById: vi.fn(async (routeId: number) => ({
    id: routeId,
    userId: 1,
    name: "Test Route",
    scheduledDate: new Date("2025-12-10T09:00:00Z"),
  })),
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field: any, value: any) => ({ field, value })),
}));

// Mock schema
vi.mock("../drizzle/schema", () => ({
  users: {
    id: "id",
  },
  routes: {
    id: "id",
  },
  routeWaypoints: {
    id: "id",
    routeId: "routeId",
    position: "position",
  },
}));

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

describe("routes.addToCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates calendar events for route waypoints", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.routes.addToCalendar({
      routeId: 1,
      calendarId: "primary",
      startTime: "2025-12-10T09:00:00Z",
      accessToken: "mock-access-token",
    });

    expect(result.success).toBe(true);
    expect(result.eventsCreated).toBe(2); // 2 waypoints (excluding starting point)
    expect(result.events).toHaveLength(2);
  });

  it("rejects unauthorized access to other user's routes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock getRouteById to return a route owned by different user
    const { getRouteById } = await import("./db");
    vi.mocked(getRouteById).mockResolvedValueOnce({
      id: 999,
      userId: 999, // Different user
      name: "Other User's Route",
      scheduledDate: new Date(),
    } as any);

    await expect(
      caller.routes.addToCalendar({
        routeId: 999,
        calendarId: "primary",
        startTime: "2025-12-10T09:00:00Z",
        accessToken: "mock-access-token",
      })
    ).rejects.toThrow("Route not found");
  });
});
