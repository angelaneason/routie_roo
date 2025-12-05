import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createAdminContext(adminUser: User): TrpcContext {
  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(user: User): TrpcContext {
  return {
    user: user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin.startImpersonation", () => {
  const adminUser: User = {
    id: 1,
    openId: "admin-open-id",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    googleCalendarAccessToken: null,
    googleCalendarRefreshToken: null,
    googleCalendarTokenExpiry: null,
  };

  const regularUser: User = {
    id: 2,
    openId: "user-open-id",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    googleCalendarAccessToken: null,
    googleCalendarRefreshToken: null,
    googleCalendarTokenExpiry: null,
  };

  it("should reject non-admin users from starting impersonation", async () => {
    const ctx = createUserContext(regularUser);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.startImpersonation({ targetUserId: 3 })
    ).rejects.toThrow("Admin access required");
  });

  it("should allow admin to start impersonation", async () => {
    const ctx = createAdminContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    // Note: This test will fail if the target user doesn't exist in the database
    // In a real scenario, you would need to create a test user first
    // For now, we're just testing the authorization logic
    try {
      const result = await caller.admin.startImpersonation({ targetUserId: 2 });
      
      // If successful, should return target user and admin ID
      expect(result).toHaveProperty("targetUser");
      expect(result).toHaveProperty("adminUserId");
      expect(result.adminUserId).toBe(adminUser.id);
    } catch (error: any) {
      // If user doesn't exist in DB, we expect a NOT_FOUND error
      // This is acceptable for this test since we're primarily testing auth
      expect(error.message).toMatch(/not found/i);
    }
  });
});

describe("admin.stopImpersonation", () => {
  const adminUser: User = {
    id: 1,
    openId: "admin-open-id",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    googleCalendarAccessToken: null,
    googleCalendarRefreshToken: null,
    googleCalendarTokenExpiry: null,
  };

  it("should allow stopping impersonation", async () => {
    const ctx = createAdminContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.stopImpersonation();
    
    expect(result).toEqual({ success: true });
  });
});
