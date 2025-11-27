import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { cachedContacts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get all contacts with modified addresses for a user
 */
export async function getChangedAddresses(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const contacts = await db.select().from(cachedContacts)
    .where(and(
      eq(cachedContacts.userId, userId),
      eq(cachedContacts.addressModified, 1)
    ));

  return contacts.map(contact => ({
    id: contact.id,
    name: contact.name,
    originalAddress: contact.originalAddress,
    currentAddress: contact.address,
    modifiedAt: contact.addressModifiedAt,
  }));
}

/**
 * Mark a contact's address as synced (clear modified flag)
 */
export async function markAddressSynced(contactId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  await db.update(cachedContacts)
    .set({
      addressModified: 0,
      addressModifiedAt: null,
    })
    .where(and(
      eq(cachedContacts.id, contactId),
      eq(cachedContacts.userId, userId)
    ));

  return { success: true };
}

/**
 * Mark all contacts' addresses as synced
 */
export async function markAllAddressesSynced(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  await db.update(cachedContacts)
    .set({
      addressModified: 0,
      addressModifiedAt: null,
    })
    .where(and(
      eq(cachedContacts.userId, userId),
      eq(cachedContacts.addressModified, 1)
    ));

  return { success: true };
}
