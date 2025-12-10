import { describe, expect, it } from "vitest";
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("billing system", () => {
  it("should have billing.clients.list procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.billing.clients.list();
    
    expect(Array.isArray(clients)).toBe(true);
  });

  it("should have billing.records.list procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const records = await caller.billing.records.list();
    
    expect(Array.isArray(records)).toBe(true);
  });

  it("should have billing.settings.get procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.billing.settings.get();
    
    // Settings may be undefined if not yet configured
    expect(settings === undefined || typeof settings === "object").toBe(true);
  });

  it("should create and update account settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.billing.settings.update({
      businessName: "Test Business",
      businessEmail: "billing@test.com",
      invoicePrefix: "TEST",
    });

    expect(result.success).toBe(true);

    const settings = await caller.billing.settings.get();
    expect(settings?.businessName).toBe("Test Business");
    expect(settings?.businessEmail).toBe("billing@test.com");
    expect(settings?.invoicePrefix).toBe("TEST");
  });
});
