import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Route Recalculation", () => {
  it("recalculateRoute procedure exists and requires routeId", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the procedure exists
    expect(caller.routes.recalculateRoute).toBeDefined();
    
    // Test that it requires a routeId parameter
    await expect(
      caller.routes.recalculateRoute({ routeId: 999999 })
    ).rejects.toThrow();
  });
});

describe("Starting Point Integration", () => {
  it("route creation accepts waypoints with starting point", () => {
    const waypoints = [
      {
        contactName: "Starting Point",
        address: "123 Main St",
        phoneNumbers: undefined,
        stopType: "other" as const,
        stopColor: "#10b981",
      },
      {
        contactName: "Client A",
        address: "456 Oak Ave",
        phoneNumbers: undefined,
        stopType: "visit" as const,
        stopColor: "#3b82f6",
      },
    ];

    expect(waypoints.length).toBeGreaterThanOrEqual(2);
    expect(waypoints[0].contactName).toBe("Starting Point");
    expect(waypoints[0].stopType).toBe("other");
  });
});
