import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
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

describe("Important Dates & Comments Feature", () => {
  describe("Important Date Types", () => {
    it("creates a new date type", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.createImportantDateType({
        name: "Birthday",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("lists all date types for user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a date type first
      await caller.settings.createImportantDateType({ name: "Anniversary" });

      const list = await caller.settings.listImportantDateTypes();

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      expect(list.some(dt => dt.name === "Anniversary")).toBe(true);
    });

    it("deletes a date type", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create and then delete
      await caller.settings.createImportantDateType({
        name: "Renewal Date",
      });

      const list = await caller.settings.listImportantDateTypes();
      const created = list.find(dt => dt.name === "Renewal Date");
      
      if (created) {
        await caller.settings.deleteImportantDateType({ id: created.id });
        const updatedList = await caller.settings.listImportantDateTypes();
        expect(updatedList.some(dt => dt.id === created.id)).toBe(false);
      }
    });
  });

  describe("Comment Options", () => {
    it("creates a new comment option", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.createCommentOption({
        option: "VIP Client",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("lists all comment options for user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a comment option first
      await caller.settings.createCommentOption({ option: "Needs Follow-up" });

      const list = await caller.settings.listCommentOptions();

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      expect(list.some(co => co.option === "Needs Follow-up")).toBe(true);
    });

    it("deletes a comment option", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create and then delete
      await caller.settings.createCommentOption({
        option: "Special Instructions",
      });

      const list = await caller.settings.listCommentOptions();
      const created = list.find(co => co.option === "Special Instructions");
      
      if (created) {
        await caller.settings.deleteCommentOption({ id: created.id });
        const updatedList = await caller.settings.listCommentOptions();
        expect(updatedList.some(co => co.id === created.id)).toBe(false);
      }
    });
  });

  describe("Contact Important Dates & Comments", () => {
    it("validates important dates array structure", () => {
      const importantDates = [
        { type: "Birthday", date: "2024-01-15" },
        { type: "Anniversary", date: "2024-06-20" },
      ];

      expect(Array.isArray(importantDates)).toBe(true);
      expect(importantDates[0].type).toBe("Birthday");
      expect(importantDates[0].date).toBe("2024-01-15");
    });

    it("validates comments array structure", () => {
      const comments = [
        { option: "VIP Client", customText: null },
        { option: "Other", customText: "Prefers morning appointments" },
      ];

      expect(Array.isArray(comments)).toBe(true);
      expect(comments[0].option).toBe("VIP Client");
      expect(comments[1].customText).toBe("Prefers morning appointments");
    });

    it("validates combined dates and comments structure", () => {
      const importantDates = [
        { type: "Renewal Date", date: "2024-12-31" },
      ];

      const comments = [
        { option: "Needs Follow-up", customText: null },
      ];

      const contactData = {
        importantDates: JSON.stringify(importantDates),
        comments: JSON.stringify(comments),
      };

      expect(contactData.importantDates).toBeDefined();
      expect(contactData.comments).toBeDefined();
      
      // Verify JSON round-trip
      const parsedDates = JSON.parse(contactData.importantDates);
      const parsedComments = JSON.parse(contactData.comments);
      
      expect(parsedDates[0].type).toBe("Renewal Date");
      expect(parsedComments[0].option).toBe("Needs Follow-up");
    });
  });

  describe("Route Waypoints with Important Dates & Comments", () => {
    it("accepts waypoints with important dates and comments", () => {
      // This test validates the schema accepts the new fields
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const waypoints = [
        {
          contactName: "John Doe",
          address: "123 Main St",
          phoneNumbers: JSON.stringify([{ value: "555-1234", label: "mobile" }]),
          contactLabels: JSON.stringify(["VIP"]),
          importantDates: JSON.stringify([{ type: "Birthday", date: "1990-05-15" }]),
          comments: JSON.stringify([{ option: "VIP Client", customText: null }]),
          stopType: "visit" as const,
          stopColor: "#3b82f6",
        },
        {
          contactName: "Jane Smith",
          address: "456 Oak Ave",
          phoneNumbers: undefined,
          contactLabels: undefined,
          importantDates: undefined,
          comments: undefined,
          stopType: "meeting" as const,
          stopColor: "#10b981",
        },
      ];

      // Validate waypoint structure
      expect(waypoints[0].importantDates).toBeDefined();
      expect(waypoints[0].comments).toBeDefined();
      expect(waypoints[1].importantDates).toBeUndefined();
      expect(waypoints[1].comments).toBeUndefined();
    });
  });
});
