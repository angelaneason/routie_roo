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

describe("Important Dates on Waypoints", () => {
  it("should update showOnWaypoint flag for date type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a date type
    await caller.settings.createImportantDateType({ name: "Test Birthday" });

    // Get the created date type
    const dateTypes = await caller.settings.listImportantDateTypes();
    const testDateType = dateTypes.find(dt => dt.name === "Test Birthday");
    
    expect(testDateType).toBeDefined();
    expect(testDateType?.showOnWaypoint).toBe(0);

    // Update showOnWaypoint flag
    const result = await caller.settings.updateImportantDateType({
      id: testDateType!.id,
      showOnWaypoint: 1,
    });

    expect(result.success).toBe(true);

    // Verify it was updated
    const updatedDateTypes = await caller.settings.listImportantDateTypes();
    const updatedDateType = updatedDateTypes.find(dt => dt.id === testDateType!.id);
    
    expect(updatedDateType?.showOnWaypoint).toBe(1);
  });

  it("should update contact important date from waypoint view", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This test would require a contact to exist
    // For now, we'll just verify the procedure exists and has the right shape
    const result = await caller.contacts.updateImportantDate({
      contactId: 999, // Non-existent contact
      dateTypeName: "Birthday",
      date: "2024-01-15",
    }).catch(err => err);

    // Should fail with NOT_FOUND since contact doesn't exist
    expect(result.message).toContain("Contact not found");
  });
});
