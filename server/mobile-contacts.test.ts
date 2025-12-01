import { describe, expect, it } from "vitest";

describe("Mobile Contact Card Features", () => {
  it("should parse phone numbers from JSON string", () => {
    const phoneNumbersJson = '[{"value":"1234567890","label":"mobile"}]';
    const phones = JSON.parse(phoneNumbersJson);
    
    expect(phones).toHaveLength(1);
    expect(phones[0].value).toBe("1234567890");
    expect(phones[0].label).toBe("mobile");
  });

  it("should filter out system labels from contact labels", () => {
    const labels = [
      "myContacts",
      "starred",
      "contactGroups/abc123",
      "Custom Label",
      "VIP"
    ];

    const userFriendlyLabels = labels.filter((label: string) => {
      const lower = label.toLowerCase();
      return lower !== 'mycontacts' && 
             lower !== 'starred' && 
             !label.startsWith('contactGroups/');
    });

    expect(userFriendlyLabels).toHaveLength(2);
    expect(userFriendlyLabels).toContain("Custom Label");
    expect(userFriendlyLabels).toContain("VIP");
  });

  it("should format phone number for tel: link", () => {
    const phoneNumber = "(555) 123-4567";
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const telLink = `tel:+1${cleanNumber}`;
    
    expect(cleanNumber).toBe("5551234567");
    expect(telLink).toBe("tel:+15551234567");
  });

  it("should format phone number for SMS link", () => {
    const phoneNumber = "555-123-4567";
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const smsLink = `sms:+1${cleanNumber}`;
    
    expect(cleanNumber).toBe("5551234567");
    expect(smsLink).toBe("sms:+15551234567");
  });

  it("should encode address for Google Maps navigation", () => {
    const address = "123 Main St, City, State 12345";
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    
    expect(mapsUrl).toContain("123%20Main%20St");
    expect(mapsUrl).toContain("destination=");
  });

  it("should detect contacts without addresses", () => {
    const contacts = [
      { id: 1, name: "John", address: "123 Main St" },
      { id: 2, name: "Jane", address: null },
      { id: 3, name: "Bob", address: "" },
      { id: 4, name: "Alice", address: "   " }
    ];

    const contactsWithoutAddress = contacts.filter(c => 
      !c.address || c.address.trim() === ""
    );

    expect(contactsWithoutAddress).toHaveLength(3);
    expect(contactsWithoutAddress.map(c => c.id)).toEqual([2, 3, 4]);
  });

  it("should parse important dates from JSON", () => {
    const datesJson = '[{"type":"Birthday","date":"2024-01-15"},{"type":"License Renewal","date":"2024-06-30"}]';
    const dates = JSON.parse(datesJson);
    
    expect(dates).toHaveLength(2);
    expect(dates[0].type).toBe("Birthday");
    expect(new Date(dates[0].date).getMonth()).toBe(0); // January
  });

  it("should parse comments from JSON", () => {
    const commentsJson = '[{"option":"VIP Client"},{"option":"Other","customText":"Needs follow-up"}]';
    const comments = JSON.parse(commentsJson);
    
    expect(comments).toHaveLength(2);
    expect(comments[0].option).toBe("VIP Client");
    expect(comments[1].customText).toBe("Needs follow-up");
  });

  it("should handle contact with all fields populated", () => {
    const contact = {
      id: 1,
      name: "John Doe",
      address: "123 Main St",
      photoUrl: "https://example.com/photo.jpg",
      phoneNumbers: '[{"value":"5551234567","label":"mobile"}]',
      labels: '["Custom Label","VIP"]',
      importantDates: '[{"type":"Birthday","date":"2024-01-15"}]',
      comments: '[{"option":"VIP Client"}]',
      isActive: 1
    };

    const phones = JSON.parse(contact.phoneNumbers);
    const labels = JSON.parse(contact.labels);
    const dates = JSON.parse(contact.importantDates);
    const comments = JSON.parse(contact.comments);

    expect(phones[0].value).toBe("5551234567");
    expect(labels).toContain("VIP");
    expect(dates[0].type).toBe("Birthday");
    expect(comments[0].option).toBe("VIP Client");
  });

  it("should handle contact with minimal fields", () => {
    const contact = {
      id: 1,
      name: "Jane Doe",
      address: null,
      photoUrl: null,
      phoneNumbers: null,
      labels: null,
      importantDates: null,
      comments: null,
      isActive: 1
    };

    const hasPhone = contact.phoneNumbers && contact.phoneNumbers !== "[]";
    const hasAddress = contact.address && contact.address.trim() !== "";

    expect(hasPhone).toBeFalsy();
    expect(hasAddress).toBeFalsy();
  });
});
