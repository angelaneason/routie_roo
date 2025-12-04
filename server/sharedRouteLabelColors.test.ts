import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 38,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Shared Route Label Colors", () => {
  it("should include labelColors in getByShareToken response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Use existing share token from the database
    const shareToken = "7eecac49-2649-4963-acb8-889fcf172473";

    const result = await caller.routes.getByShareToken({ shareToken });

    expect(result).toHaveProperty("route");
    expect(result).toHaveProperty("waypoints");
    expect(result).toHaveProperty("labelColors");
    expect(Array.isArray(result.labelColors)).toBe(true);
  });

  it("should return label colors for the route owner", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const shareToken = "7eecac49-2649-4963-acb8-889fcf172473";
    const result = await caller.routes.getByShareToken({ shareToken });

    // Check that label colors have the expected structure
    if (result.labelColors.length > 0) {
      const labelColor = result.labelColors[0];
      expect(labelColor).toHaveProperty("id");
      expect(labelColor).toHaveProperty("labelName");
      expect(labelColor).toHaveProperty("color");
      expect(labelColor.color).toMatch(/^#[0-9a-f]{6}$/i); // Valid hex color
    }
  });

  it("should return waypoints with contactLabels for label color matching", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const shareToken = "7eecac49-2649-4963-acb8-889fcf172473";
    const result = await caller.routes.getByShareToken({ shareToken });

    // Find a waypoint with labels
    const waypointWithLabels = result.waypoints.find((wp: any) => wp.contactLabels);

    if (waypointWithLabels) {
      expect(waypointWithLabels.contactLabels).toBeTruthy();
      
      // Verify it's valid JSON
      const labels = JSON.parse(waypointWithLabels.contactLabels);
      expect(Array.isArray(labels)).toBe(true);
    }
  });

  it("should apply label color logic correctly", () => {
    // Simulate the frontend logic
    const labelColors = [
      { labelName: "*Abundant", color: "#ff8ad8" },
      { labelName: "*Applesoft", color: "#ff4013" },
      { labelName: "*DeltaCare", color: "#fce101" },
    ];

    const waypoint = {
      contactLabels: JSON.stringify(["*Abundant"]),
      stopColor: "#050505", // black for Visit
    };

    let fillColor = waypoint.stopColor;
    let strokeColor = "white";
    let strokeWeight = 2;

    try {
      const labels = JSON.parse(waypoint.contactLabels);
      const labelsWithColors = labels.filter((label: string) =>
        labelColors.some((lc: any) => lc.labelName === label)
      );

      if (labelsWithColors.length === 1) {
        const labelColor = labelColors.find((lc: any) => lc.labelName === labelsWithColors[0]);
        if (labelColor) {
          fillColor = labelColor.color;
          strokeColor = waypoint.stopColor;
          strokeWeight = 4;
        }
      }
    } catch (e) {
      // Invalid JSON, use defaults
    }

    // Should use *Abundant pink as center, black as border
    expect(fillColor).toBe("#ff8ad8");
    expect(strokeColor).toBe("#050505");
    expect(strokeWeight).toBe(4);
  });

  it("should use stop color when contact has multiple labels with colors", () => {
    const labelColors = [
      { labelName: "*Abundant", color: "#ff8ad8" },
      { labelName: "*Applesoft", color: "#ff4013" },
    ];

    const waypoint = {
      contactLabels: JSON.stringify(["*Abundant", "*Applesoft"]),
      stopColor: "#050505",
    };

    let fillColor = waypoint.stopColor;
    let strokeColor = "white";
    let strokeWeight = 2;

    try {
      const labels = JSON.parse(waypoint.contactLabels);
      const labelsWithColors = labels.filter((label: string) =>
        labelColors.some((lc: any) => lc.labelName === label)
      );

      if (labelsWithColors.length === 1) {
        const labelColor = labelColors.find((lc: any) => lc.labelName === labelsWithColors[0]);
        if (labelColor) {
          fillColor = labelColor.color;
          strokeColor = waypoint.stopColor;
          strokeWeight = 4;
        }
      }
    } catch (e) {
      // Invalid JSON, use defaults
    }

    // Should use stop color (black) since multiple labels have colors
    expect(fillColor).toBe("#050505");
    expect(strokeColor).toBe("white");
    expect(strokeWeight).toBe(2);
  });
});
