import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { users, cachedContacts } from "../drizzle/schema";
import { getDb } from "./db";

// Mock Google Auth functions
vi.mock("./googleAuth", () => ({
  getAllContactGroups: vi.fn().mockResolvedValue([
    { resourceName: "contactGroups/test1", name: "Friends", memberCount: 5 },
    { resourceName: "contactGroups/test2", name: "Family", memberCount: 3 },
  ]),
  createContactGroup: vi.fn().mockResolvedValue({
    resourceName: "contactGroups/test3",
    name: "Colleagues",
  }),
  updateContactLabels: vi.fn().mockResolvedValue(undefined),
  fetchContactGroupNames: vi.fn().mockResolvedValue(
    new Map([
      ["contactGroups/test1", "Friends"],
      ["contactGroups/test2", "Family"],
      ["contactGroups/test3", "Colleagues"],
    ])
  ),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Label Management", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);

    // Set up mock user with Google Contacts tokens
    const db = await getDb();
    if (db) {
      await db
        .update(users)
        .set({
          googleContactsAccessToken: "mock-access-token",
          googleContactsRefreshToken: "mock-refresh-token",
          googleContactsTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
        } as any)
        .where({ id: ctx.user.id } as any);
    }
  });

  describe("contacts.getAllLabels", () => {
    it("fetches all contact groups from Google", async () => {
      const result = await caller.contacts.getAllLabels();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        resourceName: "contactGroups/test1",
        name: "Friends",
        memberCount: 5,
      });
      expect(result[1]).toMatchObject({
        resourceName: "contactGroups/test2",
        name: "Family",
        memberCount: 3,
      });
    });

    it("throws error when Google Contacts not connected", async () => {
      // Remove access token
      const db = await getDb();
      if (db) {
        await db
          .update(users)
          .set({
            googleContactsAccessToken: null,
          } as any)
          .where({ id: ctx.user.id } as any);
      }

      await expect(caller.contacts.getAllLabels()).rejects.toThrow(
        "Google Contacts not connected"
      );
    });
  });

  describe("contacts.createLabel", () => {
    it("creates a new contact group in Google", async () => {
      const result = await caller.contacts.createLabel({
        name: "Colleagues",
      });

      expect(result).toMatchObject({
        resourceName: "contactGroups/test3",
        name: "Colleagues",
      });
    });

    it("throws error for empty label name", async () => {
      await expect(
        caller.contacts.createLabel({ name: "" })
      ).rejects.toThrow();
    });
  });

  describe("contacts.updateLabels", () => {
    it("updates contact labels and syncs to Google", async () => {
      // Create a test contact
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const insertResult = await db.insert(cachedContacts).values({
        userId: ctx.user.id,
        googleResourceName: "people/test123",
        name: "Test Contact",
        email: "test@contact.com",
        address: "123 Test St",
        addresses: JSON.stringify([]),
        phoneNumbers: JSON.stringify([]),
        photoUrl: null,
        labels: JSON.stringify(["Friends"]),
        isActive: 1,
      });

      const contactId = Number(insertResult[0].insertId);

      // Update labels
      const result = await caller.contacts.updateLabels({
        contactId,
        labelResourceNames: ["contactGroups/test1", "contactGroups/test2"],
      });

      expect(result.success).toBe(true);
      expect(result.labels).toEqual(["Friends", "Family"]);

      // Verify database was updated
      const updatedContact = await db
        .select()
        .from(cachedContacts)
        .where({ id: contactId } as any)
        .limit(1);

      expect(updatedContact.length).toBe(1);
      const labels = JSON.parse(updatedContact[0].labels || "[]");
      expect(labels).toEqual(["Friends", "Family"]);
    });

    it("throws error for contact without Google resource name", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const insertResult = await db.insert(cachedContacts).values({
        userId: ctx.user.id,
        googleResourceName: null,
        name: "Local Contact",
        email: "local@contact.com",
        address: "456 Local St",
        addresses: JSON.stringify([]),
        phoneNumbers: JSON.stringify([]),
        photoUrl: null,
        labels: JSON.stringify([]),
        isActive: 1,
      });

      const contactId = Number(insertResult[0].insertId);

      await expect(
        caller.contacts.updateLabels({
          contactId,
          labelResourceNames: ["contactGroups/test1"],
        })
      ).rejects.toThrow("Contact not synced with Google");
    });

    it("throws error for non-existent contact", async () => {
      await expect(
        caller.contacts.updateLabels({
          contactId: 999999,
          labelResourceNames: ["contactGroups/test1"],
        })
      ).rejects.toThrow("Contact not found");
    });
  });

  describe("Label Workflow Integration", () => {
    it("completes full label management workflow", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Fetch all labels
      const allLabels = await caller.contacts.getAllLabels();
      expect(allLabels.length).toBeGreaterThan(0);

      // 2. Create a new label
      const newLabel = await caller.contacts.createLabel({
        name: "Work Team",
      });
      expect(newLabel.name).toBe("Colleagues"); // Mocked response

      // 3. Create a test contact
      const insertResult = await db.insert(cachedContacts).values({
        userId: ctx.user.id,
        googleResourceName: "people/workflow123",
        name: "Workflow Contact",
        email: "workflow@test.com",
        address: "789 Workflow Ave",
        addresses: JSON.stringify([]),
        phoneNumbers: JSON.stringify([]),
        photoUrl: null,
        labels: JSON.stringify([]),
        isActive: 1,
      });

      const contactId = Number(insertResult[0].insertId);

      // 4. Assign labels to contact
      const updateResult = await caller.contacts.updateLabels({
        contactId,
        labelResourceNames: ["contactGroups/test1", "contactGroups/test3"],
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.labels).toContain("Friends");

      // 5. Verify final state
      const finalContact = await db
        .select()
        .from(cachedContacts)
        .where({ id: contactId } as any)
        .limit(1);

      const finalLabels = JSON.parse(finalContact[0].labels || "[]");
      expect(finalLabels.length).toBeGreaterThan(0);
    });
  });
});
