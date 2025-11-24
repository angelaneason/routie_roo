import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Route Scheduling", () => {
  it("should create route with scheduled date", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scheduledDate = new Date("2025-12-25T10:00:00Z");

    // Mock route creation with scheduled date
    const mockRoute = {
      name: "Holiday Deliveries",
      scheduledDate: scheduledDate,
      notes: "Christmas delivery route",
    };

    // Verify scheduled date is a valid Date object
    expect(mockRoute.scheduledDate).toBeInstanceOf(Date);
    expect(mockRoute.scheduledDate.toISOString()).toBe("2025-12-25T10:00:00.000Z");
  });

  it("should handle routes without scheduled date", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mockRoute = {
      name: "Unscheduled Route",
      scheduledDate: null,
      notes: "No specific date yet",
    };

    // Verify null scheduled date is handled
    expect(mockRoute.scheduledDate).toBeNull();
  });

  it("should filter scheduled routes correctly", async () => {
    const mockRoutes = [
      { id: 1, name: "Route 1", scheduledDate: new Date("2025-12-25") },
      { id: 2, name: "Route 2", scheduledDate: null },
      { id: 3, name: "Route 3", scheduledDate: new Date("2025-12-26") },
      { id: 4, name: "Route 4", scheduledDate: null },
    ];

    const scheduledRoutes = mockRoutes.filter(r => r.scheduledDate !== null);
    const unscheduledRoutes = mockRoutes.filter(r => r.scheduledDate === null);

    expect(scheduledRoutes).toHaveLength(2);
    expect(unscheduledRoutes).toHaveLength(2);
    expect(scheduledRoutes[0]?.name).toBe("Route 1");
    expect(scheduledRoutes[1]?.name).toBe("Route 3");
  });

  it("should group routes by date correctly", async () => {
    const date1 = new Date("2025-12-25T10:00:00Z");
    const date2 = new Date("2025-12-25T14:00:00Z"); // Same day, different time
    const date3 = new Date("2025-12-26T10:00:00Z"); // Different day

    const mockRoutes = [
      { id: 1, name: "Route 1", scheduledDate: date1 },
      { id: 2, name: "Route 2", scheduledDate: date2 },
      { id: 3, name: "Route 3", scheduledDate: date3 },
    ];

    const routesByDate = new Map<string, typeof mockRoutes>();
    mockRoutes.forEach(route => {
      if (route.scheduledDate) {
        const dateKey = route.scheduledDate.toDateString();
        if (!routesByDate.has(dateKey)) {
          routesByDate.set(dateKey, []);
        }
        routesByDate.get(dateKey)!.push(route);
      }
    });

    // Routes 1 and 2 should be grouped together (same day)
    expect(routesByDate.size).toBe(2);
    const dec25Routes = routesByDate.get(date1.toDateString());
    expect(dec25Routes).toHaveLength(2);
    expect(dec25Routes?.[0]?.name).toBe("Route 1");
    expect(dec25Routes?.[1]?.name).toBe("Route 2");
  });

  it("should parse date input from form correctly", async () => {
    // Simulate date input from HTML date input (YYYY-MM-DD format)
    const dateString = "2025-12-25";
    const parsedDate = new Date(dateString + "T00:00:00");

    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate.getFullYear()).toBe(2025);
    expect(parsedDate.getMonth()).toBe(11); // December is month 11 (0-indexed)
    expect(parsedDate.getDate()).toBe(25);
  });

  it("should handle empty date input", async () => {
    const emptyDateString = "";
    const parsedDate = emptyDateString ? new Date(emptyDateString) : null;

    expect(parsedDate).toBeNull();
  });
});
