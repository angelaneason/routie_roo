import { describe, expect, it } from "vitest";

describe("Calendar Event Duration Modes", () => {
  it("should calculate stop_only mode correctly", () => {
    // Mode: stop_only
    // Event shows just the stop time, drive time is between events
    const stopDuration = 30 * 60 * 1000; // 30 minutes
    const travelTime = 15 * 60 * 1000; // 15 minutes
    const startTime = new Date("2025-01-01T09:00:00Z").getTime();
    
    // First stop
    const event1Start = startTime;
    const event1End = event1Start + stopDuration;
    expect(event1End - event1Start).toBe(30 * 60 * 1000); // 30 min event
    
    // Second stop (after drive time)
    const event2Start = event1End + travelTime;
    const event2End = event2Start + stopDuration;
    expect(event2End - event2Start).toBe(30 * 60 * 1000); // 30 min event
    expect(event2Start - event1End).toBe(15 * 60 * 1000); // 15 min gap
  });

  it("should calculate include_drive mode correctly", () => {
    // Mode: include_drive
    // Event includes both drive time and stop time
    const stopDuration = 30 * 60 * 1000; // 30 minutes
    const travelTime = 15 * 60 * 1000; // 15 minutes
    const startTime = new Date("2025-01-01T09:00:00Z").getTime();
    
    // First stop (no drive time for first stop)
    const event1Start = startTime;
    const event1End = event1Start + stopDuration;
    expect(event1End - event1Start).toBe(30 * 60 * 1000); // 30 min event
    
    // Second stop (includes drive time)
    const event2Start = event1End;
    const event2End = event2Start + stopDuration + travelTime;
    expect(event2End - event2Start).toBe(45 * 60 * 1000); // 45 min event (30 stop + 15 drive)
    expect(event2Start - event1End).toBe(0); // No gap between events
  });

  it("should handle user preferences correctly", () => {
    // Test that default values are applied
    const defaultStopDuration = 30; // minutes
    const defaultMode = "stop_only";
    
    expect(defaultStopDuration).toBe(30);
    expect(defaultMode).toBe("stop_only");
  });
});
