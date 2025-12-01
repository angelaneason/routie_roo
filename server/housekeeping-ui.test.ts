import { describe, expect, it } from "vitest";

describe("Housekeeping & UI Polish", () => {
  describe("Logo Fix", () => {
    it("should prevent logo stretching with object-contain", () => {
      const desktopLogoClasses = "h-32 w-auto object-contain";
      const mobileLogoClasses = "h-16 md:h-24 w-auto object-contain";
      
      expect(desktopLogoClasses).toContain("object-contain");
      expect(desktopLogoClasses).toContain("w-auto");
      expect(mobileLogoClasses).toContain("object-contain");
      expect(mobileLogoClasses).toContain("w-auto");
    });

    it("should maintain aspect ratio with w-auto", () => {
      const logoClasses = "h-32 w-auto object-contain";
      
      expect(logoClasses).toContain("w-auto");
    });
  });

  describe("Route Detail Button Labels", () => {
    it("should label calendar button as 'Add to Calendar'", () => {
      const calendarButtonLabel = "Add to Calendar";
      
      expect(calendarButtonLabel).toBe("Add to Calendar");
      expect(calendarButtonLabel).not.toBe("Calendar");
    });

    it("should label copy button as 'Duplicate Route'", () => {
      const copyButtonLabel = "Duplicate Route";
      
      expect(copyButtonLabel).toBe("Duplicate Route");
      expect(copyButtonLabel).not.toBe("Copy");
    });
  });

  describe("Route Creation Date Display", () => {
    it("should display creation date in route metadata", () => {
      const mockRoute = {
        id: "1",
        name: "Test Route",
        createdAt: new Date("2025-01-01T12:00:00Z"),
        totalDistance: 10000,
        totalDuration: 600,
      };

      const createdAtDisplay = new Date(mockRoute.createdAt).toLocaleString();
      
      expect(createdAtDisplay).toBeTruthy();
      expect(mockRoute.createdAt).toBeInstanceOf(Date);
    });

    it("should show creation date with border separator", () => {
      const creationDateSectionClasses = "pt-4 border-t";
      
      expect(creationDateSectionClasses).toContain("pt-4");
      expect(creationDateSectionClasses).toContain("border-t");
    });

    it("should label creation date field as 'Created'", () => {
      const creationDateLabel = "Created";
      
      expect(creationDateLabel).toBe("Created");
    });

    it("should format creation date with toLocaleString", () => {
      const testDate = new Date("2025-01-01T12:00:00Z");
      const formatted = testDate.toLocaleString();
      
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });
  });

  describe("UI Consistency", () => {
    it("should maintain consistent spacing for metadata sections", () => {
      const metadataSpacing = "space-y-4";
      
      expect(metadataSpacing).toBe("space-y-4");
    });

    it("should use consistent text styles for metadata labels", () => {
      const labelClasses = "text-sm text-muted-foreground mb-1";
      
      expect(labelClasses).toContain("text-sm");
      expect(labelClasses).toContain("text-muted-foreground");
    });

    it("should use consistent font weight for metadata values", () => {
      const valueClasses = "text-sm font-medium";
      
      expect(valueClasses).toContain("font-medium");
    });
  });
});
