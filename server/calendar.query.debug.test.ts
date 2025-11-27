import { describe, it } from "vitest";
import { getDb } from "./db";
import { routeWaypoints, routes } from "../drizzle/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

describe("calendar query debug", () => {
  it("should debug the rescheduled stops query", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate the calendar query for November 2025
    const firstDay = new Date(2025, 10, 1); // November 1, 2025
    const lastDay = new Date(2025, 11, 0, 23, 59, 59); // Last day of November
    
    console.log("Query parameters:");
    console.log("  firstDay:", firstDay);
    console.log("  lastDay:", lastDay);
    console.log("  firstDay ISO:", firstDay.toISOString());
    console.log("  lastDay ISO:", lastDay.toISOString());

    // Get all rescheduled waypoints first (no date filter)
    const allRescheduled = await db
      .select({
        id: routeWaypoints.id,
        contactName: routeWaypoints.contactName,
        status: routeWaypoints.status,
        rescheduledDate: routeWaypoints.rescheduledDate,
      })
      .from(routeWaypoints)
      .where(
        and(
          eq(routeWaypoints.status, 'missed'),
          isNotNull(routeWaypoints.rescheduledDate)
        )
      );

    console.log(`\nAll rescheduled waypoints (no date filter): ${allRescheduled.length}`);
    allRescheduled.forEach(wp => {
      console.log(`  ${wp.contactName}: ${wp.rescheduledDate}`);
    });

    // Now try with date filter
    const filtered = await db
      .select({
        id: routeWaypoints.id,
        contactName: routeWaypoints.contactName,
        rescheduledDate: routeWaypoints.rescheduledDate,
      })
      .from(routeWaypoints)
      .innerJoin(routes, eq(routeWaypoints.routeId, routes.id))
      .where(
        and(
          eq(routes.userId, 1),
          eq(routeWaypoints.status, 'missed'),
          sql`${routeWaypoints.rescheduledDate} IS NOT NULL`,
          sql`${routeWaypoints.rescheduledDate} >= ${firstDay}`,
          sql`${routeWaypoints.rescheduledDate} <= ${lastDay}`
        )
      );

    console.log(`\nFiltered waypoints (with date range): ${filtered.length}`);
    filtered.forEach(wp => {
      console.log(`  ${wp.contactName}: ${wp.rescheduledDate}`);
    });
  });
});
