import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

describe("calendar with user 38", () => {
  it("should return rescheduled stops for user 38 in November 2025", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user 38
    const userList = await db.select().from(users).where(eq(users.id, 38)).limit(1);
    const user = userList[0];
    
    if (!user) {
      console.log("User 38 not found");
      return;
    }

    console.log(`Testing with user: ${user.name} (ID: ${user.id})`);

    // Create context
    const ctx: TrpcContext = {
      user,
      req: {} as any,
      res: {} as any,
    };

    // Call calendar.getEvents for November 2025
    const caller = appRouter.createCaller(ctx);
    const events = await caller.calendar.getEvents({
      month: 11,
      year: 2025,
    });

    console.log(`\nTotal events: ${events.length}`);
    
    // Filter for rescheduled events
    const rescheduledEvents = events.filter((e: any) => e.type === 'rescheduled');
    console.log(`Rescheduled events: ${rescheduledEvents.length}`);
    
    // Log details of each rescheduled event
    rescheduledEvents.forEach((event: any) => {
      console.log("\nRescheduled Event:");
      console.log("  Summary:", event.summary);
      console.log("  Start:", event.start);
      console.log("  Location:", event.location);
    });

    expect(rescheduledEvents.length).toBeGreaterThan(0);
  });
});
