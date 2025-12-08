import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("OAuth PUBLIC_URL Configuration", () => {
  it("should have PUBLIC_URL set to routieroo.cc", () => {
    expect(ENV.publicUrl).toBe("https://routieroo.cc");
  });

  it("should construct correct OAuth redirect URI", () => {
    const redirectUri = `${ENV.publicUrl}/api/oauth/callback`;
    expect(redirectUri).toBe("https://routieroo.cc/api/oauth/callback");
  });

  it("should have Google OAuth credentials configured", () => {
    expect(ENV.googleClientId).toBeTruthy();
    expect(ENV.googleClientId).toContain("522109117856");
    expect(ENV.googleClientSecret).toBeTruthy();
  });
});
