import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { routes, routeWaypoints } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Find the route by share token
const route = await db.select().from(routes).where(eq(routes.shareToken, "2f36ecef-0fb8-46ec-9890-a5050aaaa06b")).limit(1);

if (route.length === 0) {
  console.log("Route not found");
  process.exit(1);
}

console.log("Route ID:", route[0].id);
console.log("Route Name:", route[0].name);

// Get all waypoints for this route
const waypoints = await db.select().from(routeWaypoints).where(eq(routeWaypoints.routeId, route[0].id));

console.log("\nWaypoints with coordinates:");
waypoints.forEach((wp, idx) => {
  console.log(`${idx + 1}. ${wp.contactName} - ${wp.address}`);
  console.log(`   Lat: ${wp.latitude}, Lng: ${wp.longitude}`);
  if (wp.latitude === null || wp.longitude === null) {
    console.log("   ⚠️ MISSING COORDINATES");
  }
});

process.exit(0);
