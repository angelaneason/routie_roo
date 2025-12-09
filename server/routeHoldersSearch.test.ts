import { describe, expect, it } from "vitest";

describe("Route Holders Contact Search", () => {
  it("should filter contacts by name (case-insensitive)", () => {
    const contacts = [
      { id: 1, name: "Angela Neason", labels: "Kangaroo Crew" },
      { id: 2, name: "John Smith", labels: "Kangaroo Crew" },
      { id: 3, name: "Mary Johnson", labels: "Other" },
    ];

    const searchTerm = "ang";
    const filtered = contacts.filter((c) => {
      const labels = c.labels || "";
      const hasLabel = labels.includes("Kangaroo Crew") || labels.includes("kangaroo crew");
      const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return hasLabel && matchesSearch;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Angela Neason");
  });

  it("should only show contacts with Kangaroo Crew label", () => {
    const contacts = [
      { id: 1, name: "Angela Neason", labels: "Kangaroo Crew" },
      { id: 2, name: "John Smith", labels: "Other" },
      { id: 3, name: "Mary Johnson", labels: "Kangaroo Crew, VIP" },
    ];

    const searchTerm = "";
    const filtered = contacts.filter((c) => {
      const labels = c.labels || "";
      const hasLabel = labels.includes("Kangaroo Crew") || labels.includes("kangaroo crew");
      const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return hasLabel && matchesSearch;
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.name)).toEqual(["Angela Neason", "Mary Johnson"]);
  });

  it("should return all Kangaroo Crew contacts when search is empty", () => {
    const contacts = [
      { id: 1, name: "Angela Neason", labels: "Kangaroo Crew" },
      { id: 2, name: "John Smith", labels: "Kangaroo Crew" },
      { id: 3, name: "Mary Johnson", labels: "Other" },
    ];

    const searchTerm = "";
    const filtered = contacts.filter((c) => {
      const labels = c.labels || "";
      const hasLabel = labels.includes("Kangaroo Crew") || labels.includes("kangaroo crew");
      const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return hasLabel && matchesSearch;
    });

    expect(filtered).toHaveLength(2);
  });

  it("should handle partial name matches", () => {
    const contacts = [
      { id: 1, name: "Angela Neason", labels: "Kangaroo Crew" },
      { id: 2, name: "John Smith", labels: "Kangaroo Crew" },
      { id: 3, name: "Smith Johnson", labels: "Kangaroo Crew" },
    ];

    const searchTerm = "smith";
    const filtered = contacts.filter((c) => {
      const labels = c.labels || "";
      const hasLabel = labels.includes("Kangaroo Crew") || labels.includes("kangaroo crew");
      const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return hasLabel && matchesSearch;
    });

    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.name)).toEqual(["John Smith", "Smith Johnson"]);
  });

  it("should return empty array when no matches found", () => {
    const contacts = [
      { id: 1, name: "Angela Neason", labels: "Kangaroo Crew" },
      { id: 2, name: "John Smith", labels: "Kangaroo Crew" },
    ];

    const searchTerm = "xyz";
    const filtered = contacts.filter((c) => {
      const labels = c.labels || "";
      const hasLabel = labels.includes("Kangaroo Crew") || labels.includes("kangaroo crew");
      const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return hasLabel && matchesSearch;
    });

    expect(filtered).toHaveLength(0);
  });
});
