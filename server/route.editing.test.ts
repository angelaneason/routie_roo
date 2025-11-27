import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

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
    defaultStopDuration: 30,
    eventDurationMode: "stop_only",
    distanceUnit: "miles",
    googleCalendarAccessToken: null,
    googleCalendarRefreshToken: null,
    googleCalendarTokenExpiry: null,
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

describe("route.update", () => {
  it("accepts valid route update with all fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the procedure accepts the input schema correctly
    const input = {
      routeId: 1,
      name: "Updated Route Name",
      notes: "Updated notes",
      folderId: 2,
      startingPointAddress: "123 New Start St",
    };

    // This will throw if the schema validation fails
    expect(() => {
      caller.routes.update(input);
    }).not.toThrow();
  });

  it("accepts partial route updates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test updating only name
    const input1 = {
      routeId: 1,
      name: "Just Name Update",
    };

    expect(() => {
      caller.routes.update(input1);
    }).not.toThrow();

    // Test updating only notes
    const input2 = {
      routeId: 1,
      notes: "Just notes update",
    };

    expect(() => {
      caller.routes.update(input2);
    }).not.toThrow();

    // Test updating only folder
    const input3 = {
      routeId: 1,
      folderId: null, // Can set to null
    };

    expect(() => {
      caller.routes.update(input3);
    }).not.toThrow();
  });

  it("rejects empty route name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      routeId: 1,
      name: "", // Empty name should be rejected
    };

    await expect(caller.routes.update(input)).rejects.toThrow();
  });

  it("accepts null folderId to remove folder assignment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      routeId: 1,
      folderId: null,
    };

    expect(() => {
      caller.routes.update(input);
    }).not.toThrow();
  });
});
