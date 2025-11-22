import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { cachedContacts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("contacts.update", () => {
  it("updates contact information successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const db = await getDb();
    
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Create a test contact first
    const testContact = {
      userId: ctx.user!.id,
      googleResourceName: "people/test123",
      name: "Original Name",
      email: "original@example.com",
      address: "123 Original St",
      phoneNumbers: JSON.stringify([{ value: "+11234567890", label: "mobile" }]),
      photoUrl: null,
      labels: JSON.stringify([]),
      isActive: 1,
    };

    const insertResult = await db.insert(cachedContacts).values(testContact);
    const contactId = Number(insertResult[0].insertId);

    // Update the contact
    const result = await caller.contacts.update({
      contactId,
      name: "Updated Name",
      email: "updated@example.com",
      address: "456 Updated Ave",
      phoneNumbers: [
        { value: "+19876543210", label: "work" },
        { value: "+11112223333", label: "home" },
      ],
    });

    expect(result).toEqual({ success: true });

    // Verify the update
    const updated = await db
      .select()
      .from(cachedContacts)
      .where(eq(cachedContacts.id, contactId))
      .limit(1);

    expect(updated[0]?.name).toBe("Updated Name");
    expect(updated[0]?.email).toBe("updated@example.com");
    expect(updated[0]?.address).toBe("456 Updated Ave");
    
    const updatedPhones = JSON.parse(updated[0]?.phoneNumbers || "[]");
    expect(updatedPhones).toHaveLength(2);
    expect(updatedPhones[0]).toEqual({ value: "+19876543210", label: "work" });
    expect(updatedPhones[1]).toEqual({ value: "+11112223333", label: "home" });

    // Cleanup
    await db.delete(cachedContacts).where(eq(cachedContacts.id, contactId));
  });
});

describe("contacts.toggleActive", () => {
  it("toggles contact active status successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const db = await getDb();
    
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Create a test contact
    const testContact = {
      userId: ctx.user!.id,
      googleResourceName: "people/test456",
      name: "Test Contact",
      email: "test@example.com",
      address: "123 Test St",
      phoneNumbers: JSON.stringify([]),
      photoUrl: null,
      labels: JSON.stringify([]),
      isActive: 1,
    };

    const insertResult = await db.insert(cachedContacts).values(testContact);
    const contactId = Number(insertResult[0].insertId);

    // Toggle to inactive
    const result1 = await caller.contacts.toggleActive({
      contactId,
      isActive: false,
    });

    expect(result1).toEqual({ success: true });

    // Verify it's inactive
    const inactive = await db
      .select()
      .from(cachedContacts)
      .where(eq(cachedContacts.id, contactId))
      .limit(1);

    expect(inactive[0]?.isActive).toBe(0);

    // Toggle back to active
    const result2 = await caller.contacts.toggleActive({
      contactId,
      isActive: true,
    });

    expect(result2).toEqual({ success: true });

    // Verify it's active again
    const active = await db
      .select()
      .from(cachedContacts)
      .where(eq(cachedContacts.id, contactId))
      .limit(1);

    expect(active[0]?.isActive).toBe(1);

    // Cleanup
    await db.delete(cachedContacts).where(eq(cachedContacts.id, contactId));
  });
});

describe("contacts.list", () => {
  it("returns all contacts for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const db = await getDb();
    
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    // Create test contacts
    const testContacts = [
      {
        userId: ctx.user!.id,
        googleResourceName: "people/test1",
        name: "Active Contact",
        email: "active@example.com",
        address: "123 Active St",
        phoneNumbers: JSON.stringify([]),
        photoUrl: null,
        labels: JSON.stringify(["work", "friends"]),
        isActive: 1,
      },
      {
        userId: ctx.user!.id,
        googleResourceName: "people/test2",
        name: "Inactive Contact",
        email: "inactive@example.com",
        address: null,
        phoneNumbers: JSON.stringify([]),
        photoUrl: null,
        labels: JSON.stringify([]),
        isActive: 0,
      },
    ];

    const insertResult = await db.insert(cachedContacts).values(testContacts);
    const contactIds = [
      Number(insertResult[0].insertId),
      Number(insertResult[0].insertId) + 1,
    ];

    // Get contacts list
    const contacts = await caller.contacts.list();

    // Should include both active and inactive
    const testContactsInList = contacts.filter(c => 
      contactIds.includes(c.id)
    );

    expect(testContactsInList.length).toBeGreaterThanOrEqual(2);

    // Verify active contact
    const activeContact = testContactsInList.find(c => c.name === "Active Contact");
    expect(activeContact).toBeDefined();
    expect(activeContact?.isActive).toBe(1);
    expect(activeContact?.address).toBe("123 Active St");

    // Verify inactive contact
    const inactiveContact = testContactsInList.find(c => c.name === "Inactive Contact");
    expect(inactiveContact).toBeDefined();
    expect(inactiveContact?.isActive).toBe(0);
    expect(inactiveContact?.address).toBeNull();

    // Cleanup
    await db.delete(cachedContacts).where(eq(cachedContacts.id, contactIds[0]));
    await db.delete(cachedContacts).where(eq(cachedContacts.id, contactIds[1]));
  });
});
