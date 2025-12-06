import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userOverrides?: Partial<AuthenticatedUser>): TrpcContext {
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
    ...userOverrides,
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

describe("Smart Auto-Routing", () => {
  describe("settings.updatePreferences", () => {
    it("should update Smart Routing preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.updatePreferences({
        enableSmartRouting: 1,
        smartRoutingFolder: "Weekly Routes",
        smartRoutingStartingPoint: "123 Main St",
        autoOptimizeRoutes: 1,
      });

      expect(result).toEqual({ success: true });
    });

    it("should allow disabling Smart Routing", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.updatePreferences({
        enableSmartRouting: 0,
      });

      expect(result).toEqual({ success: true });
    });

    it("should allow null values for optional Smart Routing fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.updatePreferences({
        enableSmartRouting: 1,
        smartRoutingFolder: null,
        smartRoutingStartingPoint: null,
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe("contacts.updateScheduledDays", () => {
    it("should update scheduled days for a contact", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Note: This test assumes a contact with ID 1 exists and belongs to the user
      // In a real test environment, you would create a test contact first
      const result = await caller.contacts.updateScheduledDays({
        contactId: 1,
        scheduledDays: ["Monday", "Wednesday", "Friday"],
      });

      expect(result).toEqual({ success: true });
    });

    it("should allow empty scheduled days array", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contacts.updateScheduledDays({
        contactId: 1,
        scheduledDays: [],
      });

      expect(result).toEqual({ success: true });
    });

    it("should handle all days of the week", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.contacts.updateScheduledDays({
        contactId: 1,
        scheduledDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      });

      expect(result).toEqual({ success: true });
    });

    it("should reject contact not owned by user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Assuming contact ID 999999 doesn't exist or doesn't belong to user
      await expect(
        caller.contacts.updateScheduledDays({
          contactId: 999999,
          scheduledDays: ["Monday"],
        })
      ).rejects.toThrow();
    });
  });
});
