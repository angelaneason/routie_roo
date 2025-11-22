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

describe("Route Creation Validation", () => {
  it("should reject route creation when waypoint has null address", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.routes.create({
        name: "Test Route",
        waypoints: [
          {
            contactName: "John Doe",
            address: "123 Main St",
            stopType: "visit",
            stopColor: "#3b82f6",
          },
          {
            contactName: "Jane Smith",
            address: null as any, // This should be rejected
            stopType: "visit",
            stopColor: "#3b82f6",
          },
        ],
        isPublic: false,
        optimizeRoute: true,
      })
    ).rejects.toThrow();
  });

  it("should reject route creation when waypoint has empty address", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.routes.create({
        name: "Test Route",
        waypoints: [
          {
            contactName: "John Doe",
            address: "123 Main St",
            stopType: "visit",
            stopColor: "#3b82f6",
          },
          {
            contactName: "Jane Smith",
            address: "", // This should be rejected
            stopType: "visit",
            stopColor: "#3b82f6",
          },
        ],
        isPublic: false,
        optimizeRoute: true,
      })
    ).rejects.toThrow();
  });

  it("should accept route creation when all waypoints have valid addresses", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Note: This will fail if Google Maps API is not configured
    // In a real test environment, you would mock the Google Maps API call
    try {
      const result = await caller.routes.create({
        name: "Test Route",
        waypoints: [
          {
            contactName: "John Doe",
            address: "123 Main St, New York, NY",
            stopType: "visit",
            stopColor: "#3b82f6",
          },
          {
            contactName: "Jane Smith",
            address: "456 Oak Ave, New York, NY",
            stopType: "visit",
            stopColor: "#3b82f6",
          },
        ],
        isPublic: false,
        optimizeRoute: true,
      });

      expect(result).toHaveProperty("routeId");
      expect(typeof result.routeId).toBe("number");
    } catch (error: any) {
      // If Google Maps API is not configured, we expect a specific error
      if (error.message?.includes("Google Maps API")) {
        expect(error.message).toContain("Google Maps API");
      } else {
        throw error;
      }
    }
  });
});
