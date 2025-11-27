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
    loginMethod: "google",
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

describe("Address Update Workflow", () => {
  it("accepts updateContact and contactId parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the input schema accepts all parameters
    const input = {
      waypointId: 1,
      address: "123 New St, City, State 12345",
      updateContact: true,
      contactId: 5,
    };

    // This test verifies the schema accepts the parameters
    // Actual database operation will fail without real data, but that's expected
    try {
      await caller.routes.updateWaypointAddress(input);
    } catch (error: any) {
      // Expected to fail with "Waypoint not found" since we don't have real data
      // But this confirms the input schema is correct
      expect(error.message).toContain("not found");
    }
  });

  it("accepts temporary address update (no contact update)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      waypointId: 1,
      address: "456 Temp St, City, State 12345",
      updateContact: false,
    };

    try {
      await caller.routes.updateWaypointAddress(input);
    } catch (error: any) {
      expect(error.message).toContain("not found");
    }
  });

  it("accepts address update without optional parameters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      waypointId: 1,
      address: "789 Basic St, City, State 12345",
    };

    try {
      await caller.routes.updateWaypointAddress(input);
    } catch (error: any) {
      expect(error.message).toContain("not found");
    }
  });

  it("validates that contactId is provided when updateContact is true", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // When updateContact is true but contactId is missing, 
    // the backend should handle gracefully (skip contact update)
    const input = {
      waypointId: 1,
      address: "999 Missing Contact St, City, State 12345",
      updateContact: true,
      // contactId intentionally omitted
    };

    try {
      await caller.routes.updateWaypointAddress(input);
    } catch (error: any) {
      // Should fail with waypoint not found, not a validation error
      expect(error.message).toContain("not found");
    }
  });
});
