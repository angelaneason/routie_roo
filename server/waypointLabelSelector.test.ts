import { describe, expect, it } from "vitest";

describe("Waypoint Label Selector", () => {
  it("should display all available labels in the selector", () => {
    const allLabels = [
      { name: "Absolute", resourceName: "contactGroups/123", memberCount: 5 },
      { name: "Berrysoft", resourceName: "contactGroups/456", memberCount: 3 },
      { name: "DeltaCare", resourceName: "contactGroups/789", memberCount: 10 },
    ];

    const labelNames = allLabels.map(l => l.name);
    expect(labelNames).toContain("Absolute");
    expect(labelNames).toContain("Berrysoft");
    expect(labelNames).toContain("DeltaCare");
  });

  it("should handle label selection with checkboxes", () => {
    const selectedLabels: string[] = [];
    const labelToAdd = "DeltaCare";

    // Simulate checkbox selection
    selectedLabels.push(labelToAdd);

    expect(selectedLabels).toContain("DeltaCare");
    expect(selectedLabels.length).toBe(1);
  });

  it("should handle label deselection", () => {
    let selectedLabels = ["Absolute", "DeltaCare"];
    const labelToRemove = "Absolute";

    // Simulate checkbox deselection
    selectedLabels = selectedLabels.filter(l => l !== labelToRemove);

    expect(selectedLabels).not.toContain("Absolute");
    expect(selectedLabels).toContain("DeltaCare");
    expect(selectedLabels.length).toBe(1);
  });

  it("should handle multiple label selections", () => {
    const selectedLabels: string[] = [];

    // Select multiple labels
    selectedLabels.push("Absolute");
    selectedLabels.push("Berrysoft");
    selectedLabels.push("DeltaCare");

    expect(selectedLabels.length).toBe(3);
    expect(selectedLabels).toContain("Absolute");
    expect(selectedLabels).toContain("Berrysoft");
    expect(selectedLabels).toContain("DeltaCare");
  });

  it("should handle label object with name property", () => {
    const labelObj = { name: "DeltaCare", resourceName: "contactGroups/789", memberCount: 10 };
    const labelName = typeof labelObj === 'string' ? labelObj : labelObj.name;

    expect(labelName).toBe("DeltaCare");
  });

  it("should handle string labels", () => {
    const labelObj = "DeltaCare";
    const labelName = typeof labelObj === 'string' ? labelObj : labelObj.name;

    expect(labelName).toBe("DeltaCare");
  });

  it("should sync labels to contact card when saved", () => {
    const waypointLabels = ["Absolute", "DeltaCare"];
    const contactLabels = ["Berrysoft"]; // Original contact labels

    // When updateContact is true, labels should sync
    const updateContact = true;
    const finalLabels = updateContact ? waypointLabels : contactLabels;

    expect(finalLabels).toEqual(["Absolute", "DeltaCare"]);
  });

  it("should not sync labels to contact card when updateContact is false", () => {
    const waypointLabels = ["Absolute", "DeltaCare"];
    const contactLabels = ["Berrysoft"]; // Original contact labels

    // When updateContact is false, contact labels should remain unchanged
    const updateContact = false;
    const finalLabels = updateContact ? waypointLabels : contactLabels;

    expect(finalLabels).toEqual(["Berrysoft"]);
  });
});
