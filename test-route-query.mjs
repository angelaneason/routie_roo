import { getRouteById, getRouteWaypoints } from "./server/db.ts";

async function testRouteQuery() {
  console.log("[Test] Testing route retrieval...");
  
  try {
    const routeId = 240001;
    console.log(`[Test] Fetching route ${routeId}...`);
    
    const route = await getRouteById(routeId);
    
    if (!route) {
      console.error(`[Test] Route ${routeId} not found in database`);
      process.exit(1);
    }
    
    console.log("[Test] Route found:", {
      id: route.id,
      name: route.name,
      userId: route.userId,
      shareId: route.shareId
    });
    
    console.log("[Test] Fetching waypoints...");
    const waypoints = await getRouteWaypoints(routeId);
    console.log(`[Test] Found ${waypoints.length} waypoints`);
    
    console.log("[Test] ✅ All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("[Test] FAILED with error:", error);
    console.error("[Test] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    process.exit(1);
  }
}

testRouteQuery();
