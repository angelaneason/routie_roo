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

describe("Starting Points System", () => {
  it("creates route with starting point address", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.routes.create({
      name: "Test Route with Starting Point",
      waypoints: [
        { address: "123 Start St, Arlington, TX" },
        { address: "456 End Ave, Arlington, TX" },
      ],
      startingPointAddress: "123 Start St, Arlington, TX",
      distanceUnit: "miles",
    });

    expect(result).toHaveProperty("routeId");
    expect(typeof result.routeId).toBe("number");
  });

  it("accepts distance unit preference in route creation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const createResult = await caller.routes.create({
      name: "Miles Route",
      waypoints: [
        { address: "123 Main St, Arlington, TX" },
        { address: "456 Oak Ave, Arlington, TX" },
      ],
      distanceUnit: "miles",
    });

    expect(createResult).toHaveProperty("routeId");
    expect(typeof createResult.routeId).toBe("number");
  });

  it("creates and lists saved starting points", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.settings.createStartingPoint({
      name: "Home",
      address: "123 Main St, Arlington, TX",
    });

    await caller.settings.createStartingPoint({
      name: "Office",
      address: "456 Work Blvd, Dallas, TX",
    });

    const points = await caller.settings.listStartingPoints();
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(points.some(p => p.name === "Home")).toBe(true);
    expect(points.some(p => p.name === "Office")).toBe(true);
  });

  it("deletes saved starting point", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.settings.createStartingPoint({
      name: "Temp Location",
      address: "789 Temp St",
    });

    const pointsBefore = await caller.settings.listStartingPoints();
    const tempPoint = pointsBefore.find(p => p.name === "Temp Location");
    expect(tempPoint).toBeDefined();

    if (tempPoint) {
      await caller.settings.deleteStartingPoint({ id: tempPoint.id });
      const pointsAfter = await caller.settings.listStartingPoints();
      expect(pointsAfter.some(p => p.id === tempPoint.id)).toBe(false);
    }
  });
});
