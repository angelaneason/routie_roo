import { describe, expect, it } from "vitest";
import { startsWithEmoji, sortLabelsSmartly, extractAndSortLabels } from "../client/src/lib/labelHelpers";

describe("labelHelpers", () => {
  describe("startsWithEmoji", () => {
    it("detects asterisk as emoji-like symbol", () => {
      expect(startsWithEmoji("*Abundant")).toBe(true);
      expect(startsWithEmoji("*Universal")).toBe(true);
      expect(startsWithEmoji("*Applesoft")).toBe(true);
    });

    it("detects symbols and special characters", () => {
      // Note: The regex catches ASCII symbols but not multi-byte Unicode emojis
      // This is intentional for performance and covers the Prairie PT use case
      expect(startsWithEmoji("@ Mention")).toBe(true);
      expect(startsWithEmoji("# Tag")).toBe(true);
      expect(startsWithEmoji("$ Money")).toBe(true);
    });

    it("returns false for regular text", () => {
      expect(startsWithEmoji("Friends")).toBe(false);
      expect(startsWithEmoji("Family")).toBe(false);
      expect(startsWithEmoji("Colleagues")).toBe(false);
      expect(startsWithEmoji("Apple")).toBe(false);
    });

    it("handles empty strings", () => {
      expect(startsWithEmoji("")).toBe(false);
    });
  });

  describe("sortLabelsSmartly", () => {
    it("sorts emoji labels first, then text labels", () => {
      const input = ["Zebra", "*Abundant", "Apple", "*Universal", "Colleagues"];
      const expected = ["*Abundant", "*Universal", "Apple", "Colleagues", "Zebra"];
      expect(sortLabelsSmartly(input)).toEqual(expected);
    });

    it("sorts emoji labels alphabetically within their group", () => {
      const input = ["*Universal", "*Abundant", "*Zebra", "*Apple"];
      const expected = ["*Abundant", "*Apple", "*Universal", "*Zebra"];
      expect(sortLabelsSmartly(input)).toEqual(expected);
    });

    it("sorts text labels alphabetically within their group", () => {
      const input = ["Zebra", "Apple", "Colleagues", "Family"];
      const expected = ["Apple", "Colleagues", "Family", "Zebra"];
      expect(sortLabelsSmartly(input)).toEqual(expected);
    });

    it("handles mixed symbol and text labels", () => {
      const input = ["Friends", "#Tag", "*Abundant", "@Mention", "Family"];
      const result = sortLabelsSmartly(input);
      
      // All symbol labels should come before text labels
      const symbolLabels = result.filter(l => startsWithEmoji(l));
      const textLabels = result.filter(l => !startsWithEmoji(l));
      
      expect(symbolLabels.length).toBe(3);
      expect(textLabels.length).toBe(2);
      
      // Symbol labels should be at the start
      expect(result.slice(0, 3)).toEqual(symbolLabels);
      // Text labels should be at the end
      expect(result.slice(3)).toEqual(textLabels);
    });

    it("handles empty array", () => {
      expect(sortLabelsSmartly([])).toEqual([]);
    });

    it("handles array with only emoji labels", () => {
      const input = ["*Zebra", "*Apple", "*Universal"];
      const expected = ["*Apple", "*Universal", "*Zebra"];
      expect(sortLabelsSmartly(input)).toEqual(expected);
    });

    it("handles array with only text labels", () => {
      const input = ["Zebra", "Apple", "Family"];
      const expected = ["Apple", "Family", "Zebra"];
      expect(sortLabelsSmartly(input)).toEqual(expected);
    });

    it("is case-insensitive", () => {
      const input = ["zebra", "Apple", "FAMILY", "colleagues"];
      const result = sortLabelsSmartly(input);
      expect(result[0].toLowerCase()).toBe("apple");
      expect(result[result.length - 1].toLowerCase()).toBe("zebra");
    });
  });

  describe("extractAndSortLabels", () => {
    it("extracts and sorts labels from contacts", () => {
      const contacts = [
        { labels: JSON.stringify(["Friends", "*Abundant", "Family"]) },
        { labels: JSON.stringify(["Colleagues", "*Universal"]) },
      ];
      
      const result = extractAndSortLabels(contacts);
      
      // Should have emoji labels first
      expect(result[0]).toBe("*Abundant");
      expect(result[1]).toBe("*Universal");
      
      // Then text labels
      expect(result.slice(2)).toContain("Colleagues");
      expect(result.slice(2)).toContain("Family");
      expect(result.slice(2)).toContain("Friends");
    });

    it("filters out system labels", () => {
      const contacts = [
        { labels: JSON.stringify(["Friends", "myContacts", "starred", "Family"]) },
      ];
      
      const result = extractAndSortLabels(contacts);
      
      expect(result).not.toContain("myContacts");
      expect(result).not.toContain("starred");
      expect(result).toContain("Friends");
      expect(result).toContain("Family");
    });

    it("filters out hex ID labels", () => {
      const contacts = [
        { labels: JSON.stringify(["Friends", "a1b2c3d4e5f6", "Family"]) },
      ];
      
      const result = extractAndSortLabels(contacts);
      
      expect(result).not.toContain("a1b2c3d4e5f6");
      expect(result).toContain("Friends");
      expect(result).toContain("Family");
    });

    it("handles contactGroups/ format", () => {
      const contacts = [
        { labels: JSON.stringify(["contactGroups/friends", "contactGroups/family"]) },
      ];
      
      const result = extractAndSortLabels(contacts);
      
      expect(result).toContain("friends");
      expect(result).toContain("family");
    });

    it("removes duplicates", () => {
      const contacts = [
        { labels: JSON.stringify(["Friends", "Family"]) },
        { labels: JSON.stringify(["Friends", "Colleagues"]) },
      ];
      
      const result = extractAndSortLabels(contacts);
      
      // Friends should only appear once
      const friendsCount = result.filter(l => l === "Friends").length;
      expect(friendsCount).toBe(1);
    });

    it("handles contacts without labels", () => {
      const contacts = [
        { labels: null },
        { labels: JSON.stringify(["Friends"]) },
        { labels: undefined },
      ];
      
      const result = extractAndSortLabels(contacts);
      
      expect(result).toEqual(["Friends"]);
    });

    it("handles invalid JSON gracefully", () => {
      const contacts = [
        { labels: "invalid json" },
        { labels: JSON.stringify(["Friends"]) },
      ];
      
      const result = extractAndSortLabels(contacts);
      
      expect(result).toEqual(["Friends"]);
    });

    it("handles empty contacts array", () => {
      expect(extractAndSortLabels([])).toEqual([]);
    });
  });

  describe("Prairie PT use case", () => {
    it("sorts Prairie PT labels correctly", () => {
      const input = [
        "Colleagues",
        "*Abundant",
        "Friends",
        "*Applesoft",
        "Family",
        "*Universal",
        "Vendors",
      ];
      
      const result = sortLabelsSmartly(input);
      
      // All * labels should come first, alphabetically
      expect(result[0]).toBe("*Abundant");
      expect(result[1]).toBe("*Applesoft");
      expect(result[2]).toBe("*Universal");
      
      // Then regular labels, alphabetically
      expect(result[3]).toBe("Colleagues");
      expect(result[4]).toBe("Family");
      expect(result[5]).toBe("Friends");
      expect(result[6]).toBe("Vendors");
    });
  });
});
