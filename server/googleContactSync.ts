import { getDb } from "./db";
import { cachedContacts, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface GoogleTokenRefreshResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Refresh expired Google OAuth access token
 */
async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenRefreshResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  return response.json();
}

/**
 * Get valid access token for user, refreshing if necessary
 */
async function getValidAccessToken(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database unavailable");
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    return null;
  }

  const userData = user[0] as any; // Type assertion for new fields
  let accessToken = userData.googleContactsAccessToken;
  const refreshToken = userData.googleContactsRefreshToken;
  const tokenExpiry = userData.googleContactsTokenExpiry;

  if (!refreshToken) {
    console.warn("[Google Sync] No refresh token available for user");
    return null;
  }

  // Check if token is expired or will expire in next 5 minutes
  const now = new Date();
  const expiryDate = tokenExpiry ? new Date(tokenExpiry) : null;
  const needsRefresh = !expiryDate || expiryDate.getTime() - now.getTime() < 5 * 60 * 1000;

  if (needsRefresh) {
    console.log("[Google Sync] Refreshing expired access token");
    try {
      const newToken = await refreshAccessToken(refreshToken);
      const newExpiryDate = new Date(Date.now() + newToken.expires_in * 1000);
      
      await db.update(users)
        .set({
          googleContactsAccessToken: newToken.access_token,
          googleContactsTokenExpiry: newExpiryDate,
        } as any)
        .where(eq(users.id, userId));
      
      accessToken = newToken.access_token;
      console.log("[Google Sync] Token refreshed successfully");
    } catch (error) {
      console.error("[Google Sync] Failed to refresh token:", error);
      return null;
    }
  }

  return accessToken;
}

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
      console.log("[Google Sync] Contact has no Google resource name, skipping sync");
      return { success: true }; // Not an error, just skip
    }

    const googleResourceName = contact[0].googleResourceName;

    // Get valid access token
    const accessToken = await getValidAccessToken(params.userId);
    if (!accessToken) {
      return { success: false, error: "No valid access token available" };
    }

    // Fetch current contact from Google to get etag
    const getResponse = await fetch(
      `https://people.googleapis.com/v1/${googleResourceName}?personFields=addresses,phoneNumbers,memberships`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error("[Google Sync] Failed to fetch contact:", errorText);
      return { success: false, error: `Failed to fetch contact: ${errorText}` };
    }

    const currentContact = await getResponse.json();
    const etag = currentContact.etag;

    // Build update payload
    const updatePayload: any = {
      etag,
      addresses: [],
      phoneNumbers: [],
      memberships: [],
    };

    // Add address if provided
    if (params.address) {
      updatePayload.addresses = [
        {
          formattedValue: params.address,
          type: "home",
        },
      ];
    }

    // Add phone numbers if provided
    if (params.phoneNumbers) {
      try {
        const phones = JSON.parse(params.phoneNumbers);
        updatePayload.phoneNumbers = phones.map((phone: any) => ({
          value: phone.value,
          type: phone.type || phone.label || "mobile",
        }));
      } catch (e) {
        console.warn("[Google Sync] Failed to parse phone numbers:", e);
      }
    }

    // Add labels/memberships if provided
    if (params.contactLabels) {
      try {
        const labels = JSON.parse(params.contactLabels);
        // Convert label names to contact group resource names
        // For now, we'll skip this as it requires fetching contact groups
        // TODO: Implement label name to resource name mapping
        console.log("[Google Sync] Label sync not yet implemented:", labels);
      } catch (e) {
        console.warn("[Google Sync] Failed to parse labels:", e);
      }
    }

    // Update contact in Google
    const updateResponse = await fetch(
      `https://people.googleapis.com/v1/${googleResourceName}:updateContact?updatePersonFields=addresses,phoneNumbers`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("[Google Sync] Failed to update contact:", errorText);
      return { success: false, error: `Failed to update contact: ${errorText}` };
    }

    console.log("[Google Sync] Successfully synced to Google Contact:", googleResourceName);
    return { success: true };
  } catch (error) {
    console.error("[Google Sync] Error:", error);
    return { success: false, error: String(error) };
  }
}
