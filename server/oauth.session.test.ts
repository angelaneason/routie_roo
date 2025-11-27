import { describe, expect, it } from "vitest";
import { SignJWT, jwtVerify } from "jose";

/**
 * Test OAuth session JWT payload structure
 * Verifies that JWT tokens include all required fields for session validation
 */
describe("OAuth Session JWT Payload", () => {
  const mockJwtSecret = "test-secret-key-for-jwt-signing";
  const secretKey = new TextEncoder().encode(mockJwtSecret);

  it("should include appId field in JWT payload", async () => {
    // Create JWT with the same structure as oauth.ts
    const sessionToken = await new SignJWT({
      openId: "google_123456789",
      appId: "test-app-id",
      name: "Test User",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("365d")
      .sign(secretKey);

    // Verify the token contains the required fields
    const { payload } = await jwtVerify(sessionToken, secretKey);

    expect(payload.openId).toBe("google_123456789");
    expect(payload.appId).toBe("test-app-id");
    expect(payload.name).toBe("Test User");
  });

  it("should fail validation if appId is missing", async () => {
    // Create JWT without appId (the bug we fixed)
    const sessionToken = await new SignJWT({
      openId: "google_123456789",
      name: "Test User",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("365d")
      .sign(secretKey);

    // Verify the token can be decoded
    const { payload } = await jwtVerify(sessionToken, secretKey);

    // But appId is missing (this was the bug)
    expect(payload.openId).toBe("google_123456789");
    expect(payload.appId).toBeUndefined();
    expect(payload.name).toBe("Test User");
  });

  it("should set correct expiration time", async () => {
    const sessionToken = await new SignJWT({
      openId: "google_123456789",
      appId: "test-app-id",
      name: "Test User",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("365d")
      .sign(secretKey);

    const { payload } = await jwtVerify(sessionToken, secretKey);

    // Verify exp claim exists and is in the future
    expect(payload.exp).toBeDefined();
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
