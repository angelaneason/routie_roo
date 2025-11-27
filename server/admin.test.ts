import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("admin user management", () => {
  it("should list all users with stats for admin", async () => {
    // Create admin context
    const adminCtx: TrpcContext = {
      user: {
        id: 1,
        openId: "admin-user",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(adminCtx);
    const users = await caller.admin.listUsers();

    console.log(`\nFound ${users.length} users:`);
    users.forEach((u: any) => {
      console.log(`  User ${u.id}: ${u.name} (${u.email})`);
      console.log(`    Routes: ${u.routeCount}, Contacts: ${u.contactCount}`);
    });

    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty("routeCount");
    expect(users[0]).toHaveProperty("contactCount");
  });

  it("should reject non-admin users from listing users", async () => {
    // Create non-admin context
    const userCtx: TrpcContext = {
      user: {
        id: 2,
        openId: "regular-user",
        email: "user@example.com",
        name: "Regular User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(userCtx);

    try {
      await caller.admin.listUsers();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should verify calendar shows rescheduled stops after consolidation", async () => {
    // Use user 38 context (the target user from consolidation)
    const user38Ctx: TrpcContext = {
      user: {
        id: 38,
        openId: "scheduling-user",
        email: "scheduling@prairiept.com",
        name: "Scheduling Prairie PT",
        loginMethod: "google",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(user38Ctx);
    const events = await caller.calendar.getEvents({
      month: 11,
      year: 2025,
    });

    const rescheduledEvents = events.filter((e: any) => e.type === 'rescheduled');
    
    console.log(`\nCalendar events for user 38 in November 2025:`);
    console.log(`  Total events: ${events.length}`);
    console.log(`  Rescheduled stops: ${rescheduledEvents.length}`);
    
    rescheduledEvents.forEach((event: any) => {
      console.log(`\n  ${event.summary}`);
      console.log(`    Time: ${event.start}`);
      console.log(`    Location: ${event.location}`);
    });

    expect(rescheduledEvents.length).toBeGreaterThan(0);
  });
});
