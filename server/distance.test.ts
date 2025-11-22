import { describe, expect, it } from "vitest";
import { convertDistance, formatDistance } from "../shared/distance";

describe("Distance Conversion", () => {
  it("should keep kilometers when unit is km", () => {
    expect(convertDistance(10, "km")).toBe(10);
    expect(convertDistance(5.5, "km")).toBe(5.5);
  });

  it("should convert kilometers to miles", () => {
    expect(convertDistance(10, "miles")).toBeCloseTo(6.21371, 4);
    expect(convertDistance(5, "miles")).toBeCloseTo(3.10686, 4);
    expect(convertDistance(1, "miles")).toBeCloseTo(0.621371, 4);
  });

  it("should format distance with correct unit", () => {
    expect(formatDistance(10, "km")).toBe("10.0 km");
    expect(formatDistance(10, "miles")).toBe("6.2 miles");
    expect(formatDistance(5.5, "km")).toBe("5.5 km");
    expect(formatDistance(5.5, "miles")).toBe("3.4 miles");
  });

  it("should handle zero distance", () => {
    expect(convertDistance(0, "km")).toBe(0);
    expect(convertDistance(0, "miles")).toBe(0);
    expect(formatDistance(0, "km")).toBe("0.0 km");
    expect(formatDistance(0, "miles")).toBe("0.0 miles");
  });
});
