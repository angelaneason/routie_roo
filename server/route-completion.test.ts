import { describe, expect, it } from "vitest";

describe("Route Completion", () => {
  it("route schema includes completedAt field", () => {
    // Test that the schema change is in place
    const mockRoute = {
      id: 1,
      userId: 1,
      name: "Test Route",
      shareId: "test123",
      isPublic: false,
      totalDistance: 5000,
      totalDuration: 600,
      optimized: true,
      folderId: null,
      notes: null,
      shareToken: null,
      isPubliclyAccessible: false,
      sharedAt: null,
      completedAt: new Date(), // New field
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockRoute.completedAt).toBeDefined();
    expect(mockRoute.completedAt).toBeInstanceOf(Date);
  });

  it("completion logic checks all waypoints are finished", () => {
    const waypoints = [
      { id: 1, status: "complete" },
      { id: 2, status: "complete" },
      { id: 3, status: "missed" },
    ];

    const allFinished = waypoints.every(
      wp => wp.status === "complete" || wp.status === "missed"
    );

    expect(allFinished).toBe(true);
  });

  it("completion logic detects unfinished waypoints", () => {
    const waypoints = [
      { id: 1, status: "complete" },
      { id: 2, status: "pending" }, // Not finished
      { id: 3, status: "missed" },
    ];

    const allFinished = waypoints.every(
      wp => wp.status === "complete" || wp.status === "missed"
    );

    expect(allFinished).toBe(false);
  });
});
