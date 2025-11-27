import { describe, it } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

describe("calendar events debug", () => {
  it("should return properly formatted rescheduled stop events", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the first user
    const userList = await db.select().from(users).limit(1);
    const user = userList[0];

    // Create context
    const ctx: TrpcContext = {
      user,
      req: {} as any,
      res: {} as any,
    };

    // Call calendar.getEvents for November 2025
    const caller = appRouter.createCaller(ctx);
    // Check what dates the query will use
    const firstDay = new Date(2025, 10, 1); // November 1, 2025 (month is 0-indexed)
    const lastDay = new Date(2025, 11, 0, 23, 59, 59); // Last day of November
    console.log("Query date range:");
    console.log("  First day:", firstDay.toISOString());
    console.log("  Last day:", lastDay.toISOString());

    const events = await caller.calendar.getEvents({
      month: 11,
      year: 2025,
    });

    console.log("\nTotal events:", events.length);
    
    // Filter for rescheduled events
    const rescheduledEvents = events.filter((e: any) => e.type === 'rescheduled');
    console.log("Rescheduled events:", rescheduledEvents.length);
    
    // Log details of each rescheduled event
    rescheduledEvents.forEach((event: any) => {
      console.log("\nRescheduled Event:");
      console.log("  ID:", event.id);
      console.log("  Summary:", event.summary);
      console.log("  Start:", event.start);
      console.log("  End:", event.end);
      console.log("  Location:", event.location);
      console.log("  Type:", event.type);
      console.log("  Color:", event.color);
    });
  });
});
