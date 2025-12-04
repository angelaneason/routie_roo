import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { dashboardPreferences, InsertDashboardPreference } from "../drizzle/schema";

export async function getDashboardPreferences(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get dashboard preferences: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(dashboardPreferences)
    .where(eq(dashboardPreferences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertDashboardPreferences(
  userId: number,
  widgetVisibility: string,
  widgetOrder: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert dashboard preferences: database not available");
    return;
  }

  try {
    await db
      .insert(dashboardPreferences)
      .values({
        userId,
        widgetVisibility,
        widgetOrder,
      })
      .onDuplicateKeyUpdate({
        set: {
          widgetVisibility,
          widgetOrder,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert dashboard preferences:", error);
    throw error;
  }
}
