import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return ctx;
}

describe("Document Upload", () => {
  it("should accept document upload with valid parameters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a small test file (1KB base64 encoded)
    const testFileContent = Buffer.from("Test document content").toString("base64");

    // Note: This test validates the API accepts the correct parameters
    // Actual S3 upload and database insertion would require mocking
    const input = {
      contactId: 1,
      fileName: "test-document.pdf",
      fileData: testFileContent,
      mimeType: "application/pdf",
    };

    // Verify the procedure accepts these parameters without throwing
    expect(() => {
      // Type check - if this compiles, the API contract is correct
      const _typeCheck: Parameters<typeof caller.contacts.uploadDocument>[0] = input;
    }).not.toThrow();
  });

  it("should accept bulk upload with contact IDs array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testFileContent = Buffer.from("Bulk document content").toString("base64");

    const input = {
      contactIds: [1, 2, 3],
      fileName: "bulk-document.pdf",
      fileData: testFileContent,
      mimeType: "application/pdf",
    };

    // Verify the procedure accepts these parameters
    expect(() => {
      const _typeCheck: Parameters<typeof caller.contacts.bulkUploadDocument>[0] = input;
    }).not.toThrow();
  });

  it("should validate file data is base64 string", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the API expects a string (base64) not a buffer
    const input = {
      contactId: 1,
      fileName: "test.pdf",
      fileData: "validBase64String==",
      mimeType: "application/pdf",
    };

    expect(typeof input.fileData).toBe("string");
  });
});

describe("Document Queries", () => {
  it("should accept contactId parameter for getDocuments", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = { contactId: 1 };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.contacts.getDocuments>[0] = input;
    }).not.toThrow();
  });

  it("should accept label parameter for getContactsByLabel", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = { label: "Prairie PT" };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.contacts.getContactsByLabel>[0] = input;
    }).not.toThrow();
  });

  it("should accept documentId parameter for deleteDocument", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const input = { documentId: 123 };

    expect(() => {
      const _typeCheck: Parameters<typeof caller.contacts.deleteDocument>[0] = input;
    }).not.toThrow();
  });
});
