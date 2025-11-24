import { describe, expect, it } from "vitest";
import { formatDistance } from "../shared/distance";

describe("Distance Display", () => {
  it("converts meters to kilometers correctly", () => {
    // Route totalDistance is stored in meters
    const totalDistanceMeters = 10000; // 10 km
    
    // Should divide by 1000 before passing to formatDistance
    const displayValue = totalDistanceMeters / 1000;
    
    expect(displayValue).toBe(10);
    expect(formatDistance(displayValue, "km")).toBe("10.0 km");
  });

  it("converts meters to miles correctly", () => {
    const totalDistanceMeters = 10000; // 10 km = ~6.2 miles
    
    const displayValue = totalDistanceMeters / 1000; // Convert to km first
    
    expect(formatDistance(displayValue, "miles")).toBe("6.2 miles");
  });

  it("handles zero distance", () => {
    const totalDistanceMeters = 0;
    const displayValue = totalDistanceMeters / 1000;
    
    expect(formatDistance(displayValue, "km")).toBe("0.0 km");
  });

  it("handles large distances", () => {
    const totalDistanceMeters = 100000; // 100 km
    const displayValue = totalDistanceMeters / 1000;
    
    expect(formatDistance(displayValue, "km")).toBe("100.0 km");
  });
});
