import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { contactDocuments, cachedContacts } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { storagePut } from "./storage";

/**
 * Upload a document for a contact
 */
export async function uploadContactDocument(params: {
  contactId: number;
  userId: number;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Verify contact belongs to user
  const contact = await db.select().from(cachedContacts)
    .where(and(
      eq(cachedContacts.id, params.contactId),
      eq(cachedContacts.userId, params.userId)
    ))
    .limit(1);

  if (!contact.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
  }

  // Generate unique file key
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileKey = `contact-documents/${params.userId}/${params.contactId}/${timestamp}-${randomSuffix}-${params.fileName}`;

  // Upload to S3
  const { url } = await storagePut(fileKey, params.fileBuffer, params.mimeType);

  // Save metadata to database
  const result = await db.insert(contactDocuments).values({
    contactId: params.contactId,
    userId: params.userId,
    fileName: params.fileName,
    fileKey,
    fileUrl: url,
    fileSize: params.fileBuffer.length,
    mimeType: params.mimeType,
  });

  return {
    id: Number(result[0].insertId),
    fileUrl: url,
  };
}

/**
 * Get all documents for a contact
 */
export async function getContactDocuments(contactId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const docs = await db.select().from(contactDocuments)
    .where(and(
      eq(contactDocuments.contactId, contactId),
      eq(contactDocuments.userId, userId)
    ));

  return docs;
}

/**
 * Delete a document
 */
export async function deleteContactDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Verify document belongs to user
  const doc = await db.select().from(contactDocuments)
    .where(and(
      eq(contactDocuments.id, documentId),
      eq(contactDocuments.userId, userId)
    ))
    .limit(1);

  if (!doc.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
  }

  // Delete from database (S3 file will remain for now - can add cleanup later)
  await db.delete(contactDocuments)
    .where(eq(contactDocuments.id, documentId));

  return { success: true };
}

/**
 * Get contacts by label for bulk operations
 */
export async function getContactsByLabel(userId: number, label: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const contacts = await db.select().from(cachedContacts)
    .where(eq(cachedContacts.userId, userId));

  // Filter contacts that have the specified label
  return contacts.filter(contact => {
    if (!contact.labels) return false;
    try {
      const labels = JSON.parse(contact.labels);
      return Array.isArray(labels) && labels.includes(label);
    } catch {
      return false;
    }
  });
}

/**
 * Bulk upload document to multiple contacts
 */
export async function bulkUploadDocument(params: {
  contactIds: number[];
  userId: number;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // Verify all contacts belong to user
  const contacts = await db.select().from(cachedContacts)
    .where(and(
      inArray(cachedContacts.id, params.contactIds),
      eq(cachedContacts.userId, params.userId)
    ));

  if (contacts.length !== params.contactIds.length) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Some contacts not found or not authorized" });
  }

  // Upload file once to S3
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileKey = `contact-documents/${params.userId}/bulk/${timestamp}-${randomSuffix}-${params.fileName}`;
  const { url } = await storagePut(fileKey, params.fileBuffer, params.mimeType);

  // Create document records for each contact
  const documentRecords = params.contactIds.map(contactId => ({
    contactId,
    userId: params.userId,
    fileName: params.fileName,
    fileKey,
    fileUrl: url,
    fileSize: params.fileBuffer.length,
    mimeType: params.mimeType,
  }));

  await db.insert(contactDocuments).values(documentRecords);

  return {
    success: true,
    contactCount: params.contactIds.length,
    fileUrl: url,
  };
}
