import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("calendar.getEvents - rescheduled stops", () => {
  it("should return rescheduled stops for November 2025", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.calendar.getEvents({
      month: 11, // November
      year: 2025,
    });

    console.log("Total events:", result.length);
    console.log("All events:", JSON.stringify(result, null, 2));

    const rescheduledEvents = result.filter((e: any) => e.type === "rescheduled");
    console.log("Rescheduled events:", rescheduledEvents.length);
    console.log("Rescheduled details:", JSON.stringify(rescheduledEvents, null, 2));

    // We know there are 2 rescheduled stops for Nov 30
    expect(rescheduledEvents.length).toBeGreaterThan(0);
  });
});
