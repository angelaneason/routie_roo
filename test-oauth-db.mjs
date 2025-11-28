import { getDb, upsertUser } from "./server/db.ts";

async function testOAuthDatabase() {
  console.log("[Test] Starting OAuth database test...");
  
  try {
    console.log("[Test] Getting database connection...");
    const db = await getDb();
    
    if (!db) {
      console.error("[Test] FAILED: Database connection is null");
      process.exit(1);
    }
    
    console.log("[Test] Database connection successful");
    
    console.log("[Test] Testing user upsert...");
    await upsertUser({
      openId: "google_test_12345",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "google",
      lastSignedIn: new Date(),
    });
    
    console.log("[Test] User upsert successful");
    console.log("[Test] ✅ All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("[Test] FAILED with error:", error);
    console.error("[Test] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    process.exit(1);
  }
}

testOAuthDatabase();
