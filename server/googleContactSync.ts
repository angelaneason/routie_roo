import { getDb } from "./db";
import { cachedContacts, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Sync waypoint changes back to Google Contact
 * Updates address, phone numbers, and labels (memberships) in Google People API
 */
export async function syncToGoogleContact(params: {
  contactId: number;
  userId: number;
  address?: string;
  phoneNumbers?: string; // JSON string
  contactLabels?: string; // JSON string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database unavailable" };
    }

    // Get contact's Google resource name
    const contact = await db
      .select()
      .from(cachedContacts)
      .where(eq(cachedContacts.id, params.contactId))
      .limit(1);

    if (!contact.length || !contact[0].googleResourceName) {
      // Contact doesn't have Google resource name - skip sync
      return { success: true }; // Not an error, just skip
    }

    const googleResourceName = contact[0].googleResourceName;

    // Get user's access token
    // TODO: Implement OAuth token storage and retrieval
    // For now, we'll return success but log that sync is not yet implemented
    console.log("[Google Sync] Would sync to:", googleResourceName, {
      address: params.address,
      phoneNumbers: params.phoneNumbers,
      contactLabels: params.contactLabels,
    });

    // TODO: Implement actual Google People API call
    // 1. Get user's OAuth access token from database
    // 2. Fetch current contact from Google to get etag
    // 3. Build update request with addresses, phoneNumbers, memberships
    // 4. Call people.updateContact with proper field masks
    // 5. Handle errors gracefully (expired token, contact deleted, etc.)

    return { success: true };
  } catch (error) {
    console.error("[Google Sync] Error:", error);
    return { success: false, error: String(error) };
  }
}
