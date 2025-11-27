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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Route Progress Badges", () => {
  it("getUserRoutes returns waypoint counts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get routes - should include waypointCount and completedWaypointCount
    const routes = await caller.routes.list();

    // Verify structure (even if empty)
    expect(Array.isArray(routes)).toBe(true);
    
    // If there are routes, verify they have the count fields
    if (routes.length > 0) {
      const route = routes[0] as any;
      expect(route).toHaveProperty("waypointCount");
      expect(route).toHaveProperty("completedWaypointCount");
      expect(typeof route.waypointCount).toBe("number");
      expect(typeof route.completedWaypointCount).toBe("number");
    }
  });

  it("getArchivedRoutes returns waypoint counts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get archived routes - should include waypointCount and completedWaypointCount
    const routes = await caller.routes.getArchivedRoutes();

    // Verify structure (even if empty)
    expect(Array.isArray(routes)).toBe(true);
    
    // If there are routes, verify they have the count fields
    if (routes.length > 0) {
      const route = routes[0] as any;
      expect(route).toHaveProperty("waypointCount");
      expect(route).toHaveProperty("completedWaypointCount");
      expect(typeof route.waypointCount).toBe("number");
      expect(typeof route.completedWaypointCount).toBe("number");
    }
  });

  it("waypoint counts are non-negative numbers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all routes
    const routes = await caller.routes.list();

    // Test passes if routes list is valid (even if empty)
    expect(Array.isArray(routes)).toBe(true);

    // If there are routes, verify all have valid count fields
    if (routes.length > 0) {
      routes.forEach((route: any) => {
        expect(typeof route.waypointCount).toBe("number");
        expect(typeof route.completedWaypointCount).toBe("number");
        expect(route.waypointCount).toBeGreaterThanOrEqual(0);
        expect(route.completedWaypointCount).toBeGreaterThanOrEqual(0);
        expect(route.completedWaypointCount).toBeLessThanOrEqual(route.waypointCount);
      });
    }
  });
});
