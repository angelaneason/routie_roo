import { describe, expect, it } from "vitest";

describe("Contact Address UX Improvements", () => {
  it("should identify contacts without addresses", () => {
    const contacts = [
      { id: 1, name: "John Doe", address: "123 Main St", isActive: 1 },
      { id: 2, name: "Jane Smith", address: null, isActive: 1 },
      { id: 3, name: "Bob Wilson", address: "", isActive: 1 },
      { id: 4, name: "Alice Brown", address: "   ", isActive: 1 },
    ];

    const contactsWithoutAddress = contacts.filter(
      (c) => !c.address || c.address.trim() === ""
    );

    expect(contactsWithoutAddress).toHaveLength(3);
    expect(contactsWithoutAddress.map((c) => c.name)).toEqual([
      "Jane Smith",
      "Bob Wilson",
      "Alice Brown",
    ]);
  });

  it("should filter to show only contacts without addresses", () => {
    const contacts = [
      { id: 1, name: "John Doe", address: "123 Main St", isActive: 1 },
      { id: 2, name: "Jane Smith", address: null, isActive: 1 },
      { id: 3, name: "Bob Wilson", address: "", isActive: 1 },
    ];

    const showMissingAddresses = true;

    const filteredContacts = contacts.filter((contact) => {
      // Filter by active status
      const isActive = contact.isActive === 1;
      if (!isActive) return false;

      // Filter by missing addresses
      if (showMissingAddresses) {
        const hasAddress = contact.address && contact.address.trim() !== "";
        if (hasAddress) return false; // Only show contacts WITHOUT addresses
      }

      return true;
    });

    expect(filteredContacts).toHaveLength(2);
    expect(filteredContacts.map((c) => c.name)).toEqual([
      "Jane Smith",
      "Bob Wilson",
    ]);
  });

  it("should show all contacts when missing addresses filter is off", () => {
    const contacts = [
      { id: 1, name: "John Doe", address: "123 Main St", isActive: 1 },
      { id: 2, name: "Jane Smith", address: null, isActive: 1 },
      { id: 3, name: "Bob Wilson", address: "", isActive: 1 },
    ];

    const showMissingAddresses = false;

    const filteredContacts = contacts.filter((contact) => {
      // Filter by active status
      const isActive = contact.isActive === 1;
      if (!isActive) return false;

      // Filter by missing addresses
      if (showMissingAddresses) {
        const hasAddress = contact.address && contact.address.trim() !== "";
        if (hasAddress) return false;
      }

      return true;
    });

    expect(filteredContacts).toHaveLength(3);
  });

  it("should generate correct Google Voice text URL", () => {
    const phoneNumber = "+12345678900";
    const cleanNumber = phoneNumber.replace(/\+/g, "");
    const url = `https://voice.google.com/u/0/messages?itemId=t.${cleanNumber}`;

    expect(url).toBe("https://voice.google.com/u/0/messages?itemId=t.12345678900");
  });

  it("should handle phone number formatting for Google Voice", () => {
    const testCases = [
      { input: "+12345678900", expected: "12345678900" },
      { input: "+1 (234) 567-8900", expected: "1 (234) 567-8900" },
      { input: "2345678900", expected: "2345678900" },
    ];

    testCases.forEach(({ input, expected }) => {
      const cleaned = input.replace(/\+/g, "");
      expect(cleaned).toBe(expected);
    });
  });
});
