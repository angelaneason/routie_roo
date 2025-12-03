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

describe("Notification Template Save", () => {
  it("should save 30-day reminder email subject", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customSubject = "🔔 Custom Test: {dateType} in 30 days";

    // Update the 30-day reminder subject
    await caller.settings.updatePreferences({
      reminderEmail30DaysSubject: customSubject,
    });

    // Verify it was saved by fetching user data
    const user = await caller.auth.me();
    expect(user?.reminderEmail30DaysSubject).toBe(customSubject);
  });

  it("should save 30-day reminder email body for contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customBody = "Hi {contactName}! Custom test body for 30 days.";

    await caller.settings.updatePreferences({
      reminderEmail30DaysBodyContact: customBody,
    });

    const user = await caller.auth.me();
    expect(user?.reminderEmail30DaysBodyContact).toBe(customBody);
  });

  it("should save 10-day reminder templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customSubject = "⚠️ Custom: {dateType} in 10 days";
    const customBody = "Hi {contactName}! 10 days left!";

    await caller.settings.updatePreferences({
      reminderEmail10DaysSubject: customSubject,
      reminderEmail10DaysBodyContact: customBody,
    });

    const user = await caller.auth.me();
    expect(user?.reminderEmail10DaysSubject).toBe(customSubject);
    expect(user?.reminderEmail10DaysBodyContact).toBe(customBody);
  });

  it("should save 5-day reminder templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customSubject = "🚨 Custom Urgent: {dateType} in 5 days";
    const customTeamBody = "Team: Urgent follow-up needed for {contactName}";

    await caller.settings.updatePreferences({
      reminderEmail5DaysSubject: customSubject,
      reminderEmail5DaysBodyTeam: customTeamBody,
    });

    const user = await caller.auth.me();
    expect(user?.reminderEmail5DaysSubject).toBe(customSubject);
    expect(user?.reminderEmail5DaysBodyTeam).toBe(customTeamBody);
  });

  it("should save past due reminder templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const customSubject = "❗ Custom Overdue: {dateType}";
    const customContactBody = "Hi {contactName}! This is overdue!";
    const customTeamBody = "Team: {contactName} is past due on {dateType}";

    await caller.settings.updatePreferences({
      reminderEmailPastDueSubject: customSubject,
      reminderEmailPastDueBodyContact: customContactBody,
      reminderEmailPastDueBodyTeam: customTeamBody,
    });

    const user = await caller.auth.me();
    expect(user?.reminderEmailPastDueSubject).toBe(customSubject);
    expect(user?.reminderEmailPastDueBodyContact).toBe(customContactBody);
    expect(user?.reminderEmailPastDueBodyTeam).toBe(customTeamBody);
  });

  it("should handle multiple template updates in sequence", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First update
    await caller.settings.updatePreferences({
      reminderEmail30DaysSubject: "First version",
    });

    let user = await caller.auth.me();
    expect(user?.reminderEmail30DaysSubject).toBe("First version");

    // Second update (simulating user editing again)
    await caller.settings.updatePreferences({
      reminderEmail30DaysSubject: "Second version - edited",
    });

    user = await caller.auth.me();
    expect(user?.reminderEmail30DaysSubject).toBe("Second version - edited");

    // Third update
    await caller.settings.updatePreferences({
      reminderEmail30DaysSubject: "Final version after navigation",
    });

    user = await caller.auth.me();
    expect(user?.reminderEmail30DaysSubject).toBe("Final version after navigation");
  });
});
