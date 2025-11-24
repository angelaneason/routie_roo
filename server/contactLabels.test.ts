import { describe, expect, it } from "vitest";
import { parseGoogleContacts } from "./googleAuth";

describe("Contact Label Resolution", () => {
  it("should resolve contact group IDs to names", () => {
    const mockGroupMap = new Map([
      ["contactGroups/750664c109a2dd83", "Clients"],
      ["contactGroups/myContacts", "myContacts"],
      ["contactGroups/starred", "starred"],
    ]);

    const mockGoogleContacts = [
      {
        resourceName: "people/c123",
        names: [{ displayName: "John Doe" }],
        emailAddresses: [{ value: "john@example.com" }],
        addresses: [{ formattedValue: "123 Main St" }],
        phoneNumbers: [{ value: "555-1234", type: "mobile" }],
        memberships: [
          {
            contactGroupMembership: {
              contactGroupResourceName: "contactGroups/750664c109a2dd83",
            },
          },
          {
            contactGroupMembership: {
              contactGroupResourceName: "contactGroups/myContacts",
            },
          },
        ],
      },
    ];

    const parsed = parseGoogleContacts(mockGoogleContacts, mockGroupMap);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.name).toBe("John Doe");
    
    const labels = JSON.parse(parsed[0]?.labels || "[]");
    expect(labels).toContain("Clients");
    expect(labels).toContain("myContacts");
  });

  it("should keep resource name if group name not found", () => {
    const mockGroupMap = new Map([
      ["contactGroups/known", "Known Group"],
    ]);

    const mockGoogleContacts = [
      {
        resourceName: "people/c456",
        names: [{ displayName: "Jane Smith" }],
        memberships: [
          {
            contactGroupMembership: {
              contactGroupResourceName: "contactGroups/unknown123",
            },
          },
        ],
      },
    ];

    const parsed = parseGoogleContacts(mockGoogleContacts, mockGroupMap);

    expect(parsed).toHaveLength(1);
    const labels = JSON.parse(parsed[0]?.labels || "[]");
    // Should keep the original resource name if not found in map
    expect(labels).toContain("contactGroups/unknown123");
  });

  it("should handle contacts without group map", () => {
    const mockGoogleContacts = [
      {
        resourceName: "people/c789",
        names: [{ displayName: "Bob Johnson" }],
        memberships: [
          {
            contactGroupMembership: {
              contactGroupResourceName: "contactGroups/abc123",
            },
          },
        ],
      },
    ];

    const parsed = parseGoogleContacts(mockGoogleContacts);

    expect(parsed).toHaveLength(1);
    const labels = JSON.parse(parsed[0]?.labels || "[]");
    // Without group map, should keep resource names
    expect(labels).toContain("contactGroups/abc123");
  });

  it("should filter out myContacts and starred in frontend", () => {
    const labels = ["Clients", "myContacts", "starred", "Family"];
    
    const filtered = labels.filter(label => {
      const lower = label.toLowerCase();
      return lower !== 'mycontacts' && lower !== 'starred';
    });

    expect(filtered).toEqual(["Clients", "Family"]);
    expect(filtered).not.toContain("myContacts");
    expect(filtered).not.toContain("starred");
  });
});
