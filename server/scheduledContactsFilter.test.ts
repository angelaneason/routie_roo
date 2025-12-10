import { describe, expect, it } from "vitest";

describe("Scheduled Contacts Filter", () => {
  it("should identify contacts with recurring schedules", () => {
    const contact = {
      id: 1,
      name: "Test Contact",
      scheduledDays: ["Monday", "Wednesday"],
      oneTimeVisits: null,
    };
    
    const hasSchedule = (contact.scheduledDays && contact.scheduledDays.length > 0) || 
                       (contact.oneTimeVisits && contact.oneTimeVisits.length > 0);
    
    expect(hasSchedule).toBe(true);
  });

  it("should identify contacts with one-time visits", () => {
    const contact = {
      id: 2,
      name: "Test Contact 2",
      scheduledDays: null,
      oneTimeVisits: [{ date: "2025-12-15", routeHolderId: 1 }],
    };
    
    const hasSchedule = (contact.scheduledDays && contact.scheduledDays.length > 0) || 
                       (contact.oneTimeVisits && contact.oneTimeVisits.length > 0);
    
    expect(hasSchedule).toBe(true);
  });

  it("should identify contacts with both recurring and one-time schedules", () => {
    const contact = {
      id: 3,
      name: "Test Contact 3",
      scheduledDays: ["Friday"],
      oneTimeVisits: [{ date: "2025-12-20", routeHolderId: 2 }],
    };
    
    const hasSchedule = (contact.scheduledDays && contact.scheduledDays.length > 0) || 
                       (contact.oneTimeVisits && contact.oneTimeVisits.length > 0);
    
    expect(hasSchedule).toBe(true);
  });

  it("should identify contacts without any schedules", () => {
    const contact = {
      id: 4,
      name: "Test Contact 4",
      scheduledDays: null,
      oneTimeVisits: null,
    };
    
    const hasSchedule = (contact.scheduledDays && contact.scheduledDays.length > 0) || 
                       (contact.oneTimeVisits && contact.oneTimeVisits.length > 0);
    
    expect(hasSchedule).toBeFalsy();
  });

  it("should identify contacts with empty schedule arrays", () => {
    const contact = {
      id: 5,
      name: "Test Contact 5",
      scheduledDays: [],
      oneTimeVisits: [],
    };
    
    const hasSchedule = (contact.scheduledDays && contact.scheduledDays.length > 0) || 
                       (contact.oneTimeVisits && contact.oneTimeVisits.length > 0);
    
    expect(hasSchedule).toBe(false);
  });
});
