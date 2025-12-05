import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createRoute, createRouteWaypoints, getDb } from "./db";
import { routes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

  return ctx;
}

describe("routes.bulkDelete", () => {
  it("deletes multiple routes owned by the user", async () => {
    const ctx = createAuthContext(999);
    const caller = appRouter.createCaller(ctx);

    // Create test routes
    const route1 = await createRoute({
      userId: 999,
      name: "Test Route 1",
      shareId: "test-share-1",
      totalDistance: 10000,
      totalDuration: 600,
      optimized: false,
      isArchived: false,
    });
    const route1Id = route1[0].insertId as number;

    const route2 = await createRoute({
      userId: 999,
      name: "Test Route 2",
      shareId: "test-share-2",
      totalDistance: 15000,
      totalDuration: 900,
      optimized: false,
      isArchived: false,
    });
    const route2Id = route2[0].insertId as number;

    const route3 = await createRoute({
      userId: 999,
      name: "Test Route 3",
      shareId: "test-share-3",
      totalDistance: 20000,
      totalDuration: 1200,
      optimized: false,
      isArchived: false,
    });
    const route3Id = route3[0].insertId as number;

    // Bulk delete routes 1 and 2
    const result = await caller.routes.bulkDelete({
      routeIds: [route1Id, route2Id],
    });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(2);

    // Verify routes are deleted
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const remainingRoutes = await db
      .select()
      .from(routes)
      .where(eq(routes.userId, 999));

    expect(remainingRoutes.length).toBe(1);
    expect(remainingRoutes[0]?.id).toBe(route3Id);

    // Cleanup
    await db.delete(routes).where(eq(routes.id, route3Id));
  });

  it("rejects bulk delete when some routes don't belong to the user", async () => {
    const ctx1 = createAuthContext(998);
    const ctx2 = createAuthContext(997);
    const caller1 = appRouter.createCaller(ctx1);

    // Create routes for different users
    const route1 = await createRoute({
      userId: 998,
      name: "User 998 Route",
      shareId: "test-share-998",
      totalDistance: 10000,
      totalDuration: 600,
      optimized: false,
      isArchived: false,
    });
    const route1Id = route1[0].insertId as number;

    const route2 = await createRoute({
      userId: 997,
      name: "User 997 Route",
      shareId: "test-share-997",
      totalDistance: 15000,
      totalDuration: 900,
      optimized: false,
      isArchived: false,
    });
    const route2Id = route2[0].insertId as number;

    // Try to delete both routes as user 998
    await expect(
      caller1.routes.bulkDelete({
        routeIds: [route1Id, route2Id],
      })
    ).rejects.toThrow("Some routes do not exist or you don't have access to them");

    // Cleanup
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(routes).where(eq(routes.id, route1Id));
    await db.delete(routes).where(eq(routes.id, route2Id));
  });

  it("handles empty route list", async () => {
    const ctx = createAuthContext(996);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.routes.bulkDelete({
      routeIds: [],
    });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(0);
  });
});
