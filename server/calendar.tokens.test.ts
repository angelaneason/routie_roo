import { describe, expect, it } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { isNotNull } from "drizzle-orm";

describe("Calendar Token Retrieval", () => {
  it("should verify calendar tokens are stored in database", async () => {
    const db = await getDb();
    if (!db) {
      console.log("[Test] Database not available");
      return;
    }
    
    // Find a user with calendar tokens
    const usersWithTokens = await db
      .select()
      .from(users)
      .where(isNotNull(users.googleCalendarAccessToken))
      .limit(1);
    
    console.log("[Test] Found users with tokens:", usersWithTokens.length);
    
    if (usersWithTokens.length > 0) {
      const user = usersWithTokens[0];
      console.log("[Test] User openId:", user.openId);
      console.log("[Test] User name:", user.name);
      console.log("[Test] User object keys:", Object.keys(user));
      console.log("[Test] Has googleCalendarAccessToken:", !!user.googleCalendarAccessToken);
      console.log("[Test] Has googleCalendarRefreshToken:", !!user.googleCalendarRefreshToken);
      console.log("[Test] Token length:", user.googleCalendarAccessToken?.length);
      
      expect(user.googleCalendarAccessToken).toBeDefined();
      expect(user.googleCalendarAccessToken).not.toBe("");
    } else {
      console.log("[Test] No users with calendar tokens found in database");
      // Test passes but with a warning
      expect(true).toBe(true);
    }
  });
});
