import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-calendar",
    email: "calendar@example.com",
    name: "Calendar Test User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    googleAccessToken: "test-access-token",
    googleRefreshToken: "test-refresh-token",
    googleTokenExpiry: new Date(Date.now() + 3600000),
    calendarPreferences: JSON.stringify({
      visibleCalendars: ["calendar1", "calendar2"]
    }),
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

describe("Calendar Sidebar - getCalendarList", () => {
  it("should return empty array when user has no Google Calendar tokens", async () => {
    const user: AuthenticatedUser = {
      id: 2,
      openId: "test-user-no-tokens",
      email: "notoken@example.com",
      name: "No Token User",
      loginMethod: "google",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      calendarPreferences: null,
    };

    const ctx: TrpcContext = {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendar.getCalendarList();

    expect(result).toEqual([]);
  });

  it("should return empty array when tokens are expired and no refresh token", async () => {
    const user: AuthenticatedUser = {
      id: 3,
      openId: "test-user-expired",
      email: "expired@example.com",
      name: "Expired Token User",
      loginMethod: "google",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      googleAccessToken: "expired-token",
      googleRefreshToken: null,
      googleTokenExpiry: new Date(Date.now() - 3600000), // Expired 1 hour ago
      calendarPreferences: null,
    };

    const ctx: TrpcContext = {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendar.getCalendarList();

    expect(result).toEqual([]);
  });
});

describe("Calendar Sidebar - updateCalendarPreferences", () => {
  it("should save calendar visibility preferences to database", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const preferences = {
      visibleCalendars: ["calendar1", "calendar3", "calendar5"]
    };

    await caller.calendar.updateCalendarPreferences(preferences);

    // Verify preferences were saved to database
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user!.id))
      .limit(1);

    expect(updatedUser).toBeDefined();
    expect(updatedUser.calendarPreferences).toBeDefined();
    
    const savedPrefs = JSON.parse(updatedUser.calendarPreferences!);
    expect(savedPrefs.visibleCalendars).toEqual(preferences.visibleCalendars);
    expect(savedPrefs.visibleCalendars).toHaveLength(3);
    expect(savedPrefs.visibleCalendars).toContain("calendar1");
    expect(savedPrefs.visibleCalendars).toContain("calendar3");
    expect(savedPrefs.visibleCalendars).toContain("calendar5");
  });

  it("should handle empty visible calendars array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const preferences = {
      visibleCalendars: []
    };

    await caller.calendar.updateCalendarPreferences(preferences);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user!.id))
      .limit(1);

    const savedPrefs = JSON.parse(updatedUser.calendarPreferences!);
    expect(savedPrefs.visibleCalendars).toEqual([]);
  });

  it("should overwrite existing preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First save
    await caller.calendar.updateCalendarPreferences({
      visibleCalendars: ["cal1", "cal2"]
    });

    // Second save should overwrite
    await caller.calendar.updateCalendarPreferences({
      visibleCalendars: ["cal3", "cal4", "cal5"]
    });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user!.id))
      .limit(1);

    const savedPrefs = JSON.parse(updatedUser.calendarPreferences!);
    expect(savedPrefs.visibleCalendars).toEqual(["cal3", "cal4", "cal5"]);
    expect(savedPrefs.visibleCalendars).not.toContain("cal1");
    expect(savedPrefs.visibleCalendars).not.toContain("cal2");
  });
});

describe("Calendar Event Filtering", () => {
  it("should filter events by visible calendars", () => {
    const allEvents = [
      { id: "1", type: "route", summary: "Route 1", start: new Date() },
      { id: "2", type: "calendar", calendarId: "cal1", summary: "Event 1", start: new Date() },
      { id: "3", type: "calendar", calendarId: "cal2", summary: "Event 2", start: new Date() },
      { id: "4", type: "calendar", calendarId: "cal3", summary: "Event 3", start: new Date() },
    ];

    const visibleCalendars = ["cal1", "cal3"];

    const filteredEvents = allEvents.filter(event => {
      if (event.type === 'route') return true;
      return event.calendarId && visibleCalendars.includes(event.calendarId);
    });

    expect(filteredEvents).toHaveLength(3);
    expect(filteredEvents.map(e => e.id)).toEqual(["1", "2", "4"]);
    expect(filteredEvents.find(e => e.id === "3")).toBeUndefined();
  });

  it("should always show route events regardless of calendar visibility", () => {
    const allEvents = [
      { id: "1", type: "route", summary: "Route 1", start: new Date() },
      { id: "2", type: "route", summary: "Route 2", start: new Date() },
      { id: "3", type: "calendar", calendarId: "cal1", summary: "Event 1", start: new Date() },
    ];

    const visibleCalendars: string[] = []; // No calendars visible

    const filteredEvents = allEvents.filter(event => {
      if (event.type === 'route') return true;
      return event.calendarId && visibleCalendars.includes(event.calendarId);
    });

    expect(filteredEvents).toHaveLength(2);
    expect(filteredEvents.every(e => e.type === 'route')).toBe(true);
  });

  it("should show all events when all calendars are visible", () => {
    const allEvents = [
      { id: "1", type: "route", summary: "Route 1", start: new Date() },
      { id: "2", type: "calendar", calendarId: "cal1", summary: "Event 1", start: new Date() },
      { id: "3", type: "calendar", calendarId: "cal2", summary: "Event 2", start: new Date() },
    ];

    const visibleCalendars = ["cal1", "cal2"];

    const filteredEvents = allEvents.filter(event => {
      if (event.type === 'route') return true;
      return event.calendarId && visibleCalendars.includes(event.calendarId);
    });

    expect(filteredEvents).toHaveLength(3);
  });
});
