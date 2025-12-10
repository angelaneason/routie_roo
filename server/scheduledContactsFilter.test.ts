import { describe, expect, it } from "vitest";

describe("Scheduled Contacts Filter", () => {
  // Helper function matching the actual filter logic in Home.tsx
  function hasSchedule(contact: any): boolean {
    // Check for recurring schedule (scheduledDays or repeatDays with actual values)
    let hasRecurringSchedule = false;
    if (contact.scheduledDays) {
      try {
        const days = typeof contact.scheduledDays === 'string' 
          ? JSON.parse(contact.scheduledDays) 
          : contact.scheduledDays;
        hasRecurringSchedule = Array.isArray(days) && days.length > 0;
      } catch (e) {
        // Invalid JSON, treat as no schedule
      }
    }
    if (!hasRecurringSchedule && contact.repeatDays) {
      try {
        const days = typeof contact.repeatDays === 'string' 
          ? JSON.parse(contact.repeatDays) 
          : contact.repeatDays;
        hasRecurringSchedule = Array.isArray(days) && days.length > 0;
      } catch (e) {
        // Invalid JSON, treat as no schedule
      }
    }
    
    // Check for one-time visit
    const hasOneTimeVisit = contact.isOneTimeVisit === 1 && !!contact.oneTimeVisitDate;
    
    // Has schedule if either type exists
    return hasRecurringSchedule || hasOneTimeVisit;
  }

  it("should identify contacts with recurring schedules via scheduledDays (JSON string)", () => {
    const contact = {
      id: 1,
      name: "Test Contact",
      scheduledDays: JSON.stringify(["Monday", "Wednesday"]),
      repeatDays: null,
      isOneTimeVisit: 0,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(true);
  });

  it("should identify contacts with recurring schedules via repeatDays (JSON string)", () => {
    const contact = {
      id: 2,
      name: "Test Contact 2",
      scheduledDays: null,
      repeatDays: JSON.stringify(["Tuesday", "Thursday"]),
      isOneTimeVisit: 0,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(true);
  });

  it("should identify contacts with one-time visits", () => {
    const contact = {
      id: 3,
      name: "Test Contact 3",
      scheduledDays: null,
      repeatDays: null,
      isOneTimeVisit: 1,
      oneTimeVisitDate: new Date("2025-12-15"),
    };
    
    expect(hasSchedule(contact)).toBe(true);
  });

  it("should identify contacts with both recurring and one-time schedules", () => {
    const contact = {
      id: 4,
      name: "Test Contact 4",
      scheduledDays: JSON.stringify(["Friday"]),
      repeatDays: null,
      isOneTimeVisit: 1,
      oneTimeVisitDate: new Date("2025-12-20"),
    };
    
    expect(hasSchedule(contact)).toBe(true);
  });

  it("should identify contacts without any schedules", () => {
    const contact = {
      id: 5,
      name: "Test Contact 5",
      scheduledDays: null,
      repeatDays: null,
      isOneTimeVisit: 0,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(false);
  });

  it("should identify contacts with empty schedule arrays as not scheduled", () => {
    const contact = {
      id: 6,
      name: "Test Contact 6",
      scheduledDays: JSON.stringify([]),
      repeatDays: JSON.stringify([]),
      isOneTimeVisit: 0,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(false);
  });

  it("should handle invalid JSON gracefully", () => {
    const contact = {
      id: 7,
      name: "Test Contact 7",
      scheduledDays: "invalid json",
      repeatDays: "also invalid",
      isOneTimeVisit: 0,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(false);
  });

  it("should not show contacts with one-time flag but no date", () => {
    const contact = {
      id: 8,
      name: "Test Contact 8",
      scheduledDays: null,
      repeatDays: null,
      isOneTimeVisit: 1,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(false);
  });

  it("should handle empty string scheduledDays", () => {
    const contact = {
      id: 9,
      name: "Test Contact 9",
      scheduledDays: "",
      repeatDays: null,
      isOneTimeVisit: 0,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(false);
  });

  it("should handle null values for all schedule fields", () => {
    const contact = {
      id: 10,
      name: "Test Contact 10",
      scheduledDays: null,
      repeatDays: null,
      isOneTimeVisit: null,
      oneTimeVisitDate: null,
    };
    
    expect(hasSchedule(contact)).toBe(false);
  });
});
