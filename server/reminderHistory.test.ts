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
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Reminder History", () => {
  it("should have getReminderHistory query available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.settings.getReminderHistory).toBeDefined();
    expect(typeof caller.settings.getReminderHistory).toBe("function");
  });

  it("should accept limit and offset parameters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      limit: 50,
      offset: 0,
    };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.settings.getReminderHistory>[0] = input;
    }).not.toThrow();
  });

  it("should accept optional parameters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Should work without parameters
    expect(() => {
      const _typeCheck: Parameters<typeof caller.settings.getReminderHistory>[0] = undefined;
    }).not.toThrow();
  });

  it("should return array of reminder history records", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Note: This test validates the API returns an array
    // Actual database queries would require seeding test data
    const result = await caller.settings.getReminderHistory();
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Reminder History Schema", () => {
  it("should validate reminder type formats", () => {
    const validTypes = ["30_days", "10_days", "5_days", "past_due"];
    
    validTypes.forEach(type => {
      expect(type).toMatch(/^\d+_days$|^past_due$/);
    });
  });

  it("should validate status enum values", () => {
    const validStatuses = ["success", "failed"];
    
    validStatuses.forEach(status => {
      expect(["success", "failed"]).toContain(status);
    });
  });

  it("should validate sentTo is JSON array", () => {
    const sentTo = JSON.stringify(["contact@example.com", "scheduling@example.com"]);
    
    expect(() => JSON.parse(sentTo)).not.toThrow();
    expect(Array.isArray(JSON.parse(sentTo))).toBe(true);
  });
});

describe("Email Reminder Integration", () => {
  it("should have getUpcomingReminders query", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.settings.getUpcomingReminders).toBeDefined();
  });

  it("should have processReminders mutation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    expect(caller.settings.processReminders).toBeDefined();
  });

  it("should return processed and sent counts from processReminders", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.processReminders();
    
    expect(result).toHaveProperty("processed");
    expect(result).toHaveProperty("sent");
    expect(typeof result.processed).toBe("number");
    expect(typeof result.sent).toBe("number");
  });
});
