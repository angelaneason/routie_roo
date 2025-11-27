import { describe, it } from "vitest";
import { getDb } from "./db";
import { routeWaypoints } from "../drizzle/schema";
import { isNotNull } from "drizzle-orm";

describe("waypoint status debug", () => {
  it("should show statuses of rescheduled waypoints", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const waypoints = await db
      .select({
        id: routeWaypoints.id,
        contactName: routeWaypoints.contactName,
        status: routeWaypoints.status,
        rescheduledDate: routeWaypoints.rescheduledDate,
      })
      .from(routeWaypoints)
      .where(isNotNull(routeWaypoints.rescheduledDate))
      .limit(10);

    console.log(`Found ${waypoints.length} waypoints with rescheduledDate`);
    waypoints.forEach(wp => {
      console.log(`\nWaypoint ${wp.id}:`);
      console.log(`  Contact: ${wp.contactName}`);
      console.log(`  Status: ${wp.status}`);
      console.log(`  Rescheduled Date: ${wp.rescheduledDate}`);
    });
  });
});
