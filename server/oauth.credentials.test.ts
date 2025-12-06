import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("Google OAuth Credentials", () => {
  it("should have GOOGLE_CLIENT_ID configured", () => {
    expect(ENV.googleClientId).toBeTruthy();
    expect(ENV.googleClientId.length).toBeGreaterThan(0);
    expect(ENV.googleClientId).toContain(".apps.googleusercontent.com");
  });

  it("should have GOOGLE_CLIENT_SECRET configured", () => {
    expect(ENV.googleClientSecret).toBeTruthy();
    expect(ENV.googleClientSecret.length).toBeGreaterThan(0);
    expect(ENV.googleClientSecret).toMatch(/^GOCSPX-/);
  });

  it("should have valid credential format", () => {
    // Client ID should be in format: numbers-alphanumeric.apps.googleusercontent.com
    const clientIdPattern = /^\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/;
    expect(ENV.googleClientId).toMatch(clientIdPattern);

    // Client Secret should start with GOCSPX-
    expect(ENV.googleClientSecret).toMatch(/^GOCSPX-[a-zA-Z0-9_-]+$/);
  });
});
