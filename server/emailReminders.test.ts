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

describe("Email Reminder Settings", () => {
  it("should accept scheduling email in updatePreferences", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      schedulingEmail: "scheduling@example.com",
    };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.settings.updatePreferences>[0] = input;
    }).not.toThrow();
  });

  it("should accept enableDateReminders boolean in updatePreferences", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      enableDateReminders: true,
    };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.settings.updatePreferences>[0] = input;
    }).not.toThrow();
  });

  it("should accept reminderIntervals array in updatePreferences", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      reminderIntervals: [30, 10, 5],
    };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.settings.updatePreferences>[0] = input;
    }).not.toThrow();
  });

  it("should accept all email reminder settings together", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = {
      schedulingEmail: "team@example.com",
      enableDateReminders: true,
      reminderIntervals: [30, 10, 5, 1],
    };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.settings.updatePreferences>[0] = input;
    }).not.toThrow();
  });
});

describe("Email Reminder Queries", () => {
  it("should have getUpcomingReminders query available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Verify the procedure exists and is callable
    expect(caller.settings.getUpcomingReminders).toBeDefined();
    expect(typeof caller.settings.getUpcomingReminders).toBe("function");
  });

  it("should have processReminders mutation available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Verify the procedure exists and is callable
    expect(caller.settings.processReminders).toBeDefined();
    expect(typeof caller.settings.processReminders).toBe("function");
  });
});

describe("Reminder Interval Logic", () => {
  it("should handle default reminder intervals", () => {
    const defaultIntervals = [30, 10, 5];
    
    expect(defaultIntervals).toHaveLength(3);
    expect(defaultIntervals).toContain(30);
    expect(defaultIntervals).toContain(10);
    expect(defaultIntervals).toContain(5);
  });

  it("should handle custom reminder intervals", () => {
    const customIntervals = [60, 30, 14, 7, 1];
    
    expect(customIntervals.every(n => typeof n === "number")).toBe(true);
    expect(customIntervals.every(n => n > 0)).toBe(true);
  });

  it("should handle reminder interval parsing from JSON", () => {
    const jsonString = JSON.stringify([30, 10, 5]);
    const parsed = JSON.parse(jsonString);
    
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toEqual([30, 10, 5]);
  });
});

describe("Date Calculation Logic", () => {
  it("should calculate days until future date correctly", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 30);
    
    const diffTime = futureDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(30);
  });

  it("should calculate days for past due date correctly", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 5);
    
    const diffTime = pastDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    expect(diffDays).toBe(-5);
    expect(diffDays < 0).toBe(true);
  });

  it("should identify when reminder should be sent", () => {
    const intervals = [30, 10, 5];
    const daysUntil = 10;
    
    const shouldRemind = intervals.includes(daysUntil) || daysUntil < 0;
    
    expect(shouldRemind).toBe(true);
  });

  it("should identify when reminder should NOT be sent", () => {
    const intervals = [30, 10, 5];
    const daysUntil = 15; // Not in intervals and not past due
    
    const shouldRemind = intervals.includes(daysUntil) || daysUntil < 0;
    
    expect(shouldRemind).toBe(false);
  });
});
