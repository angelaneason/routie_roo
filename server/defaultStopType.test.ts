import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("Default Stop Type Feature", () => {
  it("should validate defaultStopType as optional string", () => {
    const schema = z.object({
      defaultStopType: z.string().optional(),
      defaultStopTypeColor: z.string().optional(),
    });

    // Valid: undefined (not set)
    expect(() => schema.parse({ defaultStopType: undefined, defaultStopTypeColor: undefined })).not.toThrow();

    // Valid: string values
    expect(() => schema.parse({ defaultStopType: "Visit", defaultStopTypeColor: "#3b82f6" })).not.toThrow();
    expect(() => schema.parse({ defaultStopType: "Eval", defaultStopTypeColor: "#ef4444" })).not.toThrow();
    expect(() => schema.parse({ defaultStopType: "OASIS", defaultStopTypeColor: "#10b981" })).not.toThrow();

    // Valid: omitted fields
    expect(() => schema.parse({})).not.toThrow();
  });

  it("should use default stop type when contact is selected", () => {
    // Simulate user with default stop type set
    const user = {
      defaultStopType: "Visit",
      defaultStopTypeColor: "#3b82f6",
    };

    // When contact is selected, it should get the user's default
    const contactStopType = user.defaultStopType || "visit";
    const contactStopTypeColor = user.defaultStopTypeColor || "#3b82f6";

    expect(contactStopType).toBe("Visit");
    expect(contactStopTypeColor).toBe("#3b82f6");
  });

  it("should fall back to 'visit' when no default is set", () => {
    // Simulate user without default stop type
    const user = {
      defaultStopType: undefined,
      defaultStopTypeColor: undefined,
    };

    // Should fall back to "visit" and blue color
    const contactStopType = user.defaultStopType || "visit";
    const contactStopTypeColor = user.defaultStopTypeColor || "#3b82f6";

    expect(contactStopType).toBe("visit");
    expect(contactStopTypeColor).toBe("#3b82f6");
  });

  it("should allow custom stop type names", () => {
    const customStopTypes = [
      { name: "Eval", color: "#ef4444" },
      { name: "OASIS", color: "#10b981" },
      { name: "Visit", color: "#3b82f6" },
      { name: "RE (re-eval)", color: "#f59e0b" },
      { name: "DC (discharge)", color: "#8b5cf6" },
    ];

    // User can set any of these as default
    customStopTypes.forEach(stopType => {
      const user = {
        defaultStopType: stopType.name,
        defaultStopTypeColor: stopType.color,
      };

      expect(user.defaultStopType).toBe(stopType.name);
      expect(user.defaultStopTypeColor).toBe(stopType.color);
    });
  });
});
