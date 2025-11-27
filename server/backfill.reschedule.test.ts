import { describe, it } from "vitest";
import { getDb } from "./db";
import { routeWaypoints, routes, rescheduleHistory } from "../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

describe("backfill reschedule history", () => {
  it("should backfill existing rescheduled waypoints into history table", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    console.log("Finding rescheduled waypoints...");
    
    // Get all waypoints with rescheduledDate
    const rescheduledWaypoints = await db
      .select({
        waypointId: routeWaypoints.id,
        contactName: routeWaypoints.contactName,
        address: routeWaypoints.address,
        rescheduledDate: routeWaypoints.rescheduledDate,
        missedReason: routeWaypoints.missedReason,
        routeId: routeWaypoints.routeId,
      })
      .from(routeWaypoints)
      .where(isNotNull(routeWaypoints.rescheduledDate));

    console.log(`Found ${rescheduledWaypoints.length} rescheduled waypoints`);

    for (const wp of rescheduledWaypoints) {
      // Get route info
      const routeInfo = await db
        .select({
          userId: routes.userId,
          name: routes.name,
          scheduledDate: routes.scheduledDate,
        })
        .from(routes)
        .where(eq(routes.id, wp.routeId))
        .limit(1);

      if (routeInfo.length === 0) {
        console.log(`Skipping waypoint ${wp.waypointId} - route not found`);
        continue;
      }

      const route = routeInfo[0];

      // Check if already in history
      const existing = await db
        .select()
        .from(rescheduleHistory)
        .where(eq(rescheduleHistory.waypointId, wp.waypointId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Skipping waypoint ${wp.waypointId} - already in history`);
        continue;
      }

      // Insert into history
      await db.insert(rescheduleHistory).values({
        userId: route.userId,
        waypointId: wp.waypointId,
        routeId: wp.routeId,
        routeName: route.name,
        contactName: wp.contactName || "Unknown",
        address: wp.address || "No address",
        originalDate: route.scheduledDate,
        rescheduledDate: wp.rescheduledDate!,
        missedReason: wp.missedReason,
        status: "pending",
      });

      console.log(`✓ Added waypoint ${wp.waypointId} (${wp.contactName}) to history`);
    }

    console.log("Backfill complete!");
  });
});
