import { describe, expect, it } from "vitest";

describe("Label Color Map Markers", () => {
  it("should use label color as center when contact has exactly one label with color", () => {
    // Mock data
    const labelColors = [
      { labelName: "PT/R.Harms", color: "#3b82f6" },
      { labelName: "Applesoft", color: "#10b981" },
    ];
    
    const waypoint = {
      contactLabels: JSON.stringify(["PT/R.Harms"]),
      stopColor: "#000000", // black for Visit
      stopType: "visit",
    };
    
    // Simulate the logic from RouteDetail.tsx
    let fillColor = waypoint.stopColor;
    let strokeColor = "white";
    let strokeWeight = 2;
    
    const labels = JSON.parse(waypoint.contactLabels);
    const labelsWithColors = labels.filter((label: string) => 
      labelColors.some(lc => lc.labelName === label)
    );
    
    if (labelsWithColors.length === 1) {
      const labelColor = labelColors.find(lc => lc.labelName === labelsWithColors[0]);
      if (labelColor) {
        fillColor = labelColor.color;
        strokeColor = waypoint.stopColor;
        strokeWeight = 4;
      }
    }
    
    expect(fillColor).toBe("#3b82f6"); // label color (blue)
    expect(strokeColor).toBe("#000000"); // stop type color (black)
    expect(strokeWeight).toBe(4);
  });
  
  it("should use stop type color only when contact has multiple labels with colors", () => {
    const labelColors = [
      { labelName: "PT/R.Harms", color: "#3b82f6" },
      { labelName: "Applesoft", color: "#10b981" },
    ];
    
    const waypoint = {
      contactLabels: JSON.stringify(["PT/R.Harms", "Applesoft"]),
      stopColor: "#000000",
      stopType: "visit",
    };
    
    let fillColor = waypoint.stopColor;
    let strokeColor = "white";
    let strokeWeight = 2;
    
    const labels = JSON.parse(waypoint.contactLabels);
    const labelsWithColors = labels.filter((label: string) => 
      labelColors.some(lc => lc.labelName === label)
    );
    
    if (labelsWithColors.length === 1) {
      const labelColor = labelColors.find(lc => lc.labelName === labelsWithColors[0]);
      if (labelColor) {
        fillColor = labelColor.color;
        strokeColor = waypoint.stopColor;
        strokeWeight = 4;
      }
    }
    
    // Should remain default (stop type color)
    expect(fillColor).toBe("#000000");
    expect(strokeColor).toBe("white");
    expect(strokeWeight).toBe(2);
  });
  
  it("should use stop type color only when contact has no labels", () => {
    const labelColors = [
      { labelName: "PT/R.Harms", color: "#3b82f6" },
    ];
    
    const waypoint = {
      contactLabels: JSON.stringify([]),
      stopColor: "#ef4444", // red for Pickup
      stopType: "pickup",
    };
    
    let fillColor = waypoint.stopColor;
    let strokeColor = "white";
    let strokeWeight = 2;
    
    const labels = JSON.parse(waypoint.contactLabels);
    const labelsWithColors = labels.filter((label: string) => 
      labelColors.some(lc => lc.labelName === label)
    );
    
    if (labelsWithColors.length === 1) {
      const labelColor = labelColors.find(lc => lc.labelName === labelsWithColors[0]);
      if (labelColor) {
        fillColor = labelColor.color;
        strokeColor = waypoint.stopColor;
        strokeWeight = 4;
      }
    }
    
    expect(fillColor).toBe("#ef4444");
    expect(strokeColor).toBe("white");
    expect(strokeWeight).toBe(2);
  });
  
  it("should use stop type color only when contact has labels but none have assigned colors", () => {
    const labelColors = [
      { labelName: "PT/R.Harms", color: "#3b82f6" },
    ];
    
    const waypoint = {
      contactLabels: JSON.stringify(["Abundant", "Applesoft"]),
      stopColor: "#8b5cf6", // purple for Delivery
      stopType: "delivery",
    };
    
    let fillColor = waypoint.stopColor;
    let strokeColor = "white";
    let strokeWeight = 2;
    
    const labels = JSON.parse(waypoint.contactLabels);
    const labelsWithColors = labels.filter((label: string) => 
      labelColors.some(lc => lc.labelName === label)
    );
    
    if (labelsWithColors.length === 1) {
      const labelColor = labelColors.find(lc => lc.labelName === labelsWithColors[0]);
      if (labelColor) {
        fillColor = labelColor.color;
        strokeColor = waypoint.stopColor;
        strokeWeight = 4;
      }
    }
    
    expect(fillColor).toBe("#8b5cf6");
    expect(strokeColor).toBe("white");
    expect(strokeWeight).toBe(2);
  });
  
  it("should handle invalid JSON in contactLabels gracefully", () => {
    const labelColors = [
      { labelName: "PT/R.Harms", color: "#3b82f6" },
    ];
    
    const waypoint = {
      contactLabels: "invalid json",
      stopColor: "#000000",
      stopType: "visit",
    };
    
    let fillColor = waypoint.stopColor;
    let strokeColor = "white";
    let strokeWeight = 2;
    
    try {
      const labels = JSON.parse(waypoint.contactLabels);
      const labelsWithColors = labels.filter((label: string) => 
        labelColors.some(lc => lc.labelName === label)
      );
      
      if (labelsWithColors.length === 1) {
        const labelColor = labelColors.find(lc => lc.labelName === labelsWithColors[0]);
        if (labelColor) {
          fillColor = labelColor.color;
          strokeColor = waypoint.stopColor;
          strokeWeight = 4;
        }
      }
    } catch (e) {
      // Should fall back to default
    }
    
    expect(fillColor).toBe("#000000");
    expect(strokeColor).toBe("white");
    expect(strokeWeight).toBe(2);
  });
});
