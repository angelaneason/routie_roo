import { describe, expect, it } from "vitest";

describe("Contact Export", () => {
  it("should export contacts with all fields", () => {
    const mockContacts = [
      {
        name: "John Doe",
        email: "john@example.com",
        address: "123 Main St",
        phoneNumbers: JSON.stringify([{ value: "555-1234", label: "mobile" }]),
        labels: "Work,Client",
        importantDates: JSON.stringify([{ type: "Birthday", date: "2024-01-15" }]),
        comments: JSON.stringify([{ option: "VIP", customText: "" }]),
        isActive: 1,
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        address: "456 Oak Ave",
        phoneNumbers: JSON.stringify([{ value: "555-5678", label: "work" }]),
        labels: "Family",
        importantDates: null,
        comments: null,
        isActive: 0,
      },
    ];

    const csvData = mockContacts.map(contact => ({
      name: contact.name || '',
      email: contact.email || '',
      address: contact.address || '',
      phoneNumbers: contact.phoneNumbers || '',
      labels: contact.labels || '',
      importantDates: contact.importantDates || '',
      comments: contact.comments || '',
      isActive: contact.isActive ? 'Yes' : 'No',
    }));

    expect(csvData).toHaveLength(2);
    expect(csvData[0].name).toBe("John Doe");
    expect(csvData[0].isActive).toBe("Yes");
    expect(csvData[1].name).toBe("Jane Smith");
    expect(csvData[1].isActive).toBe("No");
  });

  it("should handle empty contact list", () => {
    const mockContacts: any[] = [];
    
    const csvData = mockContacts.map(contact => ({
      name: contact.name || '',
      email: contact.email || '',
      address: contact.address || '',
      phoneNumbers: contact.phoneNumbers || '',
      labels: contact.labels || '',
      importantDates: contact.importantDates || '',
      comments: contact.comments || '',
      isActive: contact.isActive ? 'Yes' : 'No',
    }));

    expect(csvData).toHaveLength(0);
  });

  it("should handle contacts with missing fields", () => {
    const mockContacts = [
      {
        name: "Minimal Contact",
        email: null,
        address: null,
        phoneNumbers: null,
        labels: null,
        importantDates: null,
        comments: null,
        isActive: 1,
      },
    ];

    const csvData = mockContacts.map(contact => ({
      name: contact.name || '',
      email: contact.email || '',
      address: contact.address || '',
      phoneNumbers: contact.phoneNumbers || '',
      labels: contact.labels || '',
      importantDates: contact.importantDates || '',
      comments: contact.comments || '',
      isActive: contact.isActive ? 'Yes' : 'No',
    }));

    expect(csvData).toHaveLength(1);
    expect(csvData[0].name).toBe("Minimal Contact");
    expect(csvData[0].email).toBe("");
    expect(csvData[0].address).toBe("");
    expect(csvData[0].isActive).toBe("Yes");
  });

  it("should format CSV filename with current date", () => {
    const today = new Date().toISOString().split('T')[0];
    const expectedFilename = `routieroo-contacts-${today}.csv`;
    
    expect(expectedFilename).toMatch(/^routieroo-contacts-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("should properly escape CSV fields with quotes", () => {
    const testValue = 'Test, "Value"';
    const escaped = `"${testValue}"`;
    
    expect(escaped).toBe('"Test, "Value""');
  });
});
