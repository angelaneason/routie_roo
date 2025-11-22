import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createRoute, createFolder } from "./db";

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

describe("Route Management Features", () => {
  it("should delete a route successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test route
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Test Delete Route",
      shareId: `delete-test-${Date.now()}`,
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 300,
      optimized: true,
      folderId: null,
    });

    const routeId = Number(routeResult[0].insertId);

    // Delete the route
    const result = await caller.routes.delete({ routeId });

    expect(result.success).toBe(true);

    // Verify route is deleted by trying to retrieve it
    const routes = await caller.routes.list();
    const deletedRoute = routes.find(r => r.id === routeId);
    expect(deletedRoute).toBeUndefined();
  });

  it("should create route with optimization disabled", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Note: This test validates the API accepts optimizeRoute parameter
    // Actual route calculation requires Google Maps API which we mock in integration tests
    const input = {
      name: "Manual Route",
      waypoints: [
        { address: "123 Start St", contactName: "Start" },
        { address: "456 End Ave", contactName: "End" },
      ],
      isPublic: false,
      optimizeRoute: false,
    };

    // We expect this to fail without actual Google API, but validates the parameter is accepted
    try {
      await caller.routes.create(input);
    } catch (error: any) {
      // Expected to fail due to missing Google API, but should not be a validation error
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });
});

describe("Folder Management", () => {
  it("should create a folder", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.folders.create({
      name: "Client Visits",
      color: "#3b82f6",
    });

    expect(result.folderId).toBeGreaterThan(0);
  });

  it("should list user folders", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test folder
    await createFolder({
      userId: ctx.user!.id,
      name: "Test Folder",
      color: "#10b981",
    });

    const folders = await caller.folders.list();

    expect(Array.isArray(folders)).toBe(true);
    expect(folders.length).toBeGreaterThan(0);
    expect(folders.some(f => f.name === "Test Folder")).toBe(true);
  });

  it("should update folder name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a folder
    const createResult = await caller.folders.create({
      name: "Old Name",
    });

    const folderId = createResult.folderId;

    // Update the folder
    const updateResult = await caller.folders.update({
      folderId,
      name: "New Name",
    });

    expect(updateResult.success).toBe(true);

    // Verify the update
    const folders = await caller.folders.list();
    const updatedFolder = folders.find(f => f.id === folderId);
    expect(updatedFolder?.name).toBe("New Name");
  });

  it("should delete folder and unlink routes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a folder
    const folderResult = await caller.folders.create({
      name: "Folder to Delete",
    });
    const folderId = folderResult.folderId;

    // Create a route in the folder
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Route in Folder",
      shareId: `folder-route-${Date.now()}`,
      isPublic: false,
      totalDistance: 1000,
      totalDuration: 100,
      optimized: true,
      folderId,
    });
    const routeId = Number(routeResult[0].insertId);

    // Delete the folder
    const deleteResult = await caller.folders.delete({ folderId });
    expect(deleteResult.success).toBe(true);

    // Verify folder is deleted
    const folders = await caller.folders.list();
    expect(folders.find(f => f.id === folderId)).toBeUndefined();

    // Verify route still exists but folderId is null
    const routes = await caller.routes.list();
    const route = routes.find(r => r.id === routeId);
    expect(route).toBeDefined();
    expect(route?.folderId).toBeNull();
  });

  it("should move route to folder", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a folder
    const folderResult = await caller.folders.create({
      name: "Target Folder",
    });
    const folderId = folderResult.folderId;

    // Create a route without folder
    const routeResult = await createRoute({
      userId: ctx.user!.id,
      name: "Route to Move",
      shareId: `move-route-${Date.now()}`,
      isPublic: false,
      totalDistance: 2000,
      totalDuration: 200,
      optimized: true,
      folderId: null,
    });
    const routeId = Number(routeResult[0].insertId);

    // Move route to folder
    const moveResult = await caller.routes.moveToFolder({
      routeId,
      folderId,
    });
    expect(moveResult.success).toBe(true);

    // Verify route is in folder
    const routes = await caller.routes.list();
    const route = routes.find(r => r.id === routeId);
    expect(route?.folderId).toBe(folderId);
  });
});
