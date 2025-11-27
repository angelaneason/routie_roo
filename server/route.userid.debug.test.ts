import { describe, it } from "vitest";
import { getDb } from "./db";
import { routeWaypoints, routes, users } from "../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

describe("route userId debug", () => {
  it("should show userId of routes with rescheduled waypoints", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`\nTotal users: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`  User ${u.id}: ${u.name} (${u.email})`);
    });

    // Get routes with rescheduled waypoints
    const routesWithRescheduled = await db
      .select({
        routeId: routes.id,
        routeName: routes.name,
        routeUserId: routes.userId,
        waypointContact: routeWaypoints.contactName,
        rescheduledDate: routeWaypoints.rescheduledDate,
      })
      .from(routes)
      .innerJoin(routeWaypoints, eq(routes.id, routeWaypoints.routeId))
      .where(isNotNull(routeWaypoints.rescheduledDate))
      .limit(10);

    console.log(`\nRoutes with rescheduled waypoints: ${routesWithRescheduled.length}`);
    routesWithRescheduled.forEach(r => {
      console.log(`\nRoute ${r.routeId} (${r.routeName}):`);
      console.log(`  Owner userId: ${r.routeUserId}`);
      console.log(`  Contact: ${r.waypointContact}`);
      console.log(`  Rescheduled: ${r.rescheduledDate}`);
    });
  });
});
