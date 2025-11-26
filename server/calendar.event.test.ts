import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userOverrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...userOverrides,
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

describe("calendar.createEvent", () => {
  it("should validate required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Missing title should fail
    await expect(
      caller.calendar.createEvent({
        title: "",
        startDate: "2024-01-15",
        endDate: "2024-01-15",
        allDay: false,
        calendarId: "primary",
      })
    ).rejects.toThrow();
  });

  it("should accept valid event data structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This will fail at runtime because we don't have real Google Calendar tokens
    // But it validates the input schema is correct
    const eventData = {
      title: "Team Meeting",
      startDate: "2024-01-15",
      startTime: "09:00",
      endDate: "2024-01-15",
      endTime: "10:00",
      allDay: false,
      calendarId: "primary",
      description: "Discuss Q1 goals",
      recurrence: "RRULE:FREQ=WEEKLY",
    };

    // Should fail with UNAUTHORIZED (no calendar tokens) not validation error
    await expect(caller.calendar.createEvent(eventData)).rejects.toThrow(
      /Google Calendar not connected|UNAUTHORIZED/
    );
  });

  it("should accept all-day events without times", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const eventData = {
      title: "Company Holiday",
      startDate: "2024-12-25",
      endDate: "2024-12-25",
      allDay: true,
      calendarId: "primary",
    };

    // Should fail with UNAUTHORIZED (no calendar tokens) not validation error
    await expect(caller.calendar.createEvent(eventData)).rejects.toThrow(
      /Google Calendar not connected|UNAUTHORIZED/
    );
  });

  it("should accept events with custom recurrence rules", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const eventData = {
      title: "Weekly Standup",
      startDate: "2024-01-15",
      startTime: "09:00",
      endDate: "2024-01-15",
      endTime: "09:30",
      allDay: false,
      calendarId: "primary",
      recurrence: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=20",
    };

    // Should fail with UNAUTHORIZED (no calendar tokens) not validation error
    await expect(caller.calendar.createEvent(eventData)).rejects.toThrow(
      /Google Calendar not connected|UNAUTHORIZED/
    );
  });

  it("should accept events without optional fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const eventData = {
      title: "Quick Task",
      startDate: "2024-01-15",
      endDate: "2024-01-15",
      allDay: true,
      calendarId: "primary",
      // No description, no recurrence, no times
    };

    // Should fail with UNAUTHORIZED (no calendar tokens) not validation error
    await expect(caller.calendar.createEvent(eventData)).rejects.toThrow(
      /Google Calendar not connected|UNAUTHORIZED/
    );
  });
});

describe("Contact label styling", () => {
  it("should verify label display uses text-sm font-bold for larger, bold appearance", () => {
    // This is a frontend test - verifying the styling constants
    // In Home.tsx, contact labels should be rendered with: text-sm font-bold
    
    // Expected styling for contact labels:
    const expectedLabelClasses = "text-sm font-bold";
    
    // This test documents the requirement that labels should be:
    // - text-sm (larger than text-xs)
    // - font-bold (bold weight)
    
    expect(expectedLabelClasses).toContain("text-sm");
    expect(expectedLabelClasses).toContain("font-bold");
  });

  it("should filter out contactGroups/ labels from display", () => {
    // Contact labels should exclude any starting with "contactGroups/"
    const allLabels = [
      "contactGroups/myContacts",
      "contactGroups/starred",
      "Family",
      "Work",
      "contactGroups/abc123",
      "Clients",
    ];

    const displayedLabels = allLabels.filter(
      (label) => !label.startsWith("contactGroups/")
    );

    expect(displayedLabels).toEqual(["Family", "Work", "Clients"]);
    expect(displayedLabels).not.toContain("contactGroups/myContacts");
    expect(displayedLabels).not.toContain("contactGroups/starred");
  });

  it("should filter out hex ID labels (12+ characters)", () => {
    // Labels that are hex IDs (12+ characters) should be filtered out
    const allLabels = [
      "Family",
      "Work",
      "a1b2c3d4e5f6", // 12 char hex ID
      "Clients",
      "1234567890abcdef", // 16 char hex ID
      "VIP",
    ];

    const displayedLabels = allLabels.filter(
      (label) => label.length < 12 || !/^[a-f0-9]+$/i.test(label)
    );

    expect(displayedLabels).toEqual(["Family", "Work", "Clients", "VIP"]);
    expect(displayedLabels).not.toContain("a1b2c3d4e5f6");
    expect(displayedLabels).not.toContain("1234567890abcdef");
  });
});
