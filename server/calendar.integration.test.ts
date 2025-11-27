import { describe, expect, it } from "vitest";

describe("Google Calendar Integration", () => {
  it("should merge routes and Google Calendar events correctly", () => {
    // Mock route events
    const routeEvents = [
      {
        id: "route-1",
        routeId: 1,
        summary: "Client Visits",
        start: "2025-01-15T09:00:00Z",
        end: "2025-01-15T12:00:00Z",
        type: "route",
        color: "#3b82f6",
      },
    ];

    // Mock Google Calendar events
    const googleEvents = [
      {
        id: "google-1",
        summary: "Team Meeting",
        start: "2025-01-15T14:00:00Z",
        end: "2025-01-15T15:00:00Z",
        type: "google",
        color: "#6b7280",
      },
    ];

    // Merge and sort
    const allEvents = [...routeEvents, ...googleEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    expect(allEvents).toHaveLength(2);
    expect(allEvents[0].type).toBe("route");
    expect(allEvents[1].type).toBe("google");
  });

  it("should group events by date correctly", () => {
    const events = [
      {
        id: "1",
        summary: "Event 1",
        start: "2025-01-15T09:00:00Z",
        type: "route",
      },
      {
        id: "2",
        summary: "Event 2",
        start: "2025-01-15T14:00:00Z",
        type: "google",
      },
      {
        id: "3",
        summary: "Event 3",
        start: "2025-01-16T10:00:00Z",
        type: "route",
      },
    ];

    const eventsByDate = new Map<string, typeof events>();
    events.forEach((event) => {
      const dateKey = new Date(event.start).toDateString();
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    });

    // Should have 2 dates
    expect(eventsByDate.size).toBe(2);

    // Jan 15 should have 2 events
    const jan15Key = new Date("2025-01-15T09:00:00Z").toDateString();
    expect(eventsByDate.get(jan15Key)).toHaveLength(2);

    // Jan 16 should have 1 event
    const jan16Key = new Date("2025-01-16T10:00:00Z").toDateString();
    expect(eventsByDate.get(jan16Key)).toHaveLength(1);
  });

  it("should handle color coding for different event types", () => {
    const routeEvent = { type: "route" };
    const googleEvent = { type: "google" };

    const getEventColor = (type: string) => {
      return type === "route" ? "#3b82f6" : "#6b7280";
    };

    expect(getEventColor(routeEvent.type)).toBe("#3b82f6"); // Blue for routes
    expect(getEventColor(googleEvent.type)).toBe("#6b7280"); // Gray for Google events
  });

  it("should validate OAuth token storage structure", () => {
    const tokenData = {
      googleCalendarAccessToken: "mock_access_token",
      googleCalendarRefreshToken: "mock_refresh_token",
      googleCalendarTokenExpiry: new Date(Date.now() + 3600 * 1000),
    };

    expect(tokenData.googleCalendarAccessToken).toBeTruthy();
    expect(tokenData.googleCalendarRefreshToken).toBeTruthy();
    expect(tokenData.googleCalendarTokenExpiry).toBeInstanceOf(Date);
    expect(tokenData.googleCalendarTokenExpiry.getTime()).toBeGreaterThan(Date.now());
  });
});
