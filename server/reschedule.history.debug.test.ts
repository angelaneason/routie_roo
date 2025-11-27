import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { rescheduleHistory, users } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

describe("getRescheduleHistory debug", () => {
  it("should return reschedule history for authenticated user", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the first user
    const userList = await db.select().from(users).limit(1);
    console.log("Found user:", userList[0]);

    // Get reschedule history records
    const historyRecords = await db.select().from(rescheduleHistory).limit(5);
    console.log("Reschedule history records:", historyRecords);

    // Create context with the user
    const ctx: TrpcContext = {
      user: userList[0],
      req: {} as any,
      res: {} as any,
    };

    // Call the procedure
    const caller = appRouter.createCaller(ctx);
    const result = await caller.routes.getRescheduleHistory();
    
    console.log("getRescheduleHistory result:", result);
    console.log("Number of records returned:", result.length);
  });
});
