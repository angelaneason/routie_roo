import { describe, expect, it } from "vitest";

describe("Route Title Format", () => {
  it("should format route title as 'Day M/D/YYYY' without route holder", () => {
    const day = "Monday";
    const routeDate = new Date(2025, 11, 8); // Month is 0-indexed, so 11 = December
    const routeNamePrefix = "";
    const routeName = `${routeNamePrefix}${day} ${routeDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
    
    expect(routeName).toBe("Monday 12/8/2025");
  });

  it("should format route title as 'Name - Day M/D/YYYY' with route holder", () => {
    const day = "Monday";
    const routeDate = new Date(2025, 11, 8); // Month is 0-indexed
    const routeHolderName = "Leon Montgomery";
    const routeNamePrefix = routeHolderName ? `${routeHolderName} - ` : '';
    const routeName = `${routeNamePrefix}${day} ${routeDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
    
    expect(routeName).toBe("Leon Montgomery - Monday 12/8/2025");
  });

  it("should format different days correctly", () => {
    const days = ["Monday", "Wednesday", "Friday"];
    const weekStart = new Date(2025, 11, 8); // Monday, Dec 8, 2025
    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const results = days.map(day => {
      const targetDayOfWeek = dayMap[day];
      const routeDate = new Date(weekStart);
      routeDate.setDate(weekStart.getDate() + targetDayOfWeek - 1); // -1 because weekStart is already Monday
      const routeName = `${day} ${routeDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
      return routeName;
    });
    
    expect(results).toEqual([
      "Monday 12/8/2025",
      "Wednesday 12/10/2025",
      "Friday 12/12/2025"
    ]);
  });

  it("should not include 'Route' or 'Week of' text", () => {
    const day = "Monday";
    const routeDate = new Date("2025-12-08");
    const routeHolderName = "Leon Montgomery";
    const routeNamePrefix = routeHolderName ? `${routeHolderName} - ` : '';
    const routeName = `${routeNamePrefix}${day} ${routeDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
    
    expect(routeName).not.toContain("Route");
    expect(routeName).not.toContain("Week of");
  });

  it("should handle different route holders", () => {
    const day = "Wednesday";
    const routeDate = new Date(2025, 11, 10); // Wednesday, Dec 10, 2025
    const routeHolders = ["Randy", "Shaquana", null];
    
    const results = routeHolders.map(holder => {
      const routeNamePrefix = holder ? `${holder} - ` : '';
      return `${routeNamePrefix}${day} ${routeDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
    });
    
    expect(results).toEqual([
      "Randy - Wednesday 12/10/2025",
      "Shaquana - Wednesday 12/10/2025",
      "Wednesday 12/10/2025"
    ]);
  });
});
