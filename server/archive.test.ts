import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("Route Archive System", () => {
  it("archives a route successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Archive route should return success
    const result = await caller.routes.archiveRoute({ routeId: 1 });
    expect(result).toEqual({ success: true });
  });

  it("unarchives a route successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Unarchive route should return success
    const result = await caller.routes.unarchiveRoute({ routeId: 1 });
    expect(result).toEqual({ success: true });
  });

  it("lists only non-archived routes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get routes list (should exclude archived)
    const routes = await caller.routes.list();
    
    // All routes should have isArchived = false
    routes.forEach(route => {
      expect(route.isArchived).toBe(false);
    });
  });

  it("gets archived routes separately", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get archived routes
    const archivedRoutes = await caller.routes.getArchivedRoutes();
    
    // Result should be an array
    expect(Array.isArray(archivedRoutes)).toBe(true);
    
    // All routes should have isArchived = true
    archivedRoutes.forEach(route => {
      expect(route.isArchived).toBe(true);
    });
  });
});
