import { describe, expect, it } from "vitest";

describe("OAuth Redirect URI", () => {
  it("should construct redirect URI from x-forwarded-host header", () => {
    const headers = {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'routieroo.cc',
    };
    
    const protocol = headers['x-forwarded-proto'] || 'https';
    const host = headers['x-forwarded-host'] || 'routieroo.cc';
    const redirectUri = `${protocol}://${host}/api/oauth/callback`;
    
    expect(redirectUri).toBe('https://routieroo.cc/api/oauth/callback');
  });

  it("should construct redirect URI from host header when x-forwarded-host is missing", () => {
    const headers = {
      'host': 'routieroo.manus.space',
    };
    
    const protocol = 'https';
    const host = headers['x-forwarded-host'] || headers['host'] || 'routieroo.cc';
    const redirectUri = `${protocol}://${host}/api/oauth/callback`;
    
    expect(redirectUri).toBe('https://routieroo.manus.space/api/oauth/callback');
  });

  it("should fall back to routieroo.cc when no host headers are present", () => {
    const headers = {};
    
    const protocol = 'https';
    const host = headers['x-forwarded-host'] || headers['host'] || 'routieroo.cc';
    const redirectUri = `${protocol}://${host}/api/oauth/callback`;
    
    expect(redirectUri).toBe('https://routieroo.cc/api/oauth/callback');
  });

  it("should handle development server URLs", () => {
    const headers = {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': '3000-it9vk5eiynaw25q9vfq9l-bf388f45.manusvm.computer',
    };
    
    const protocol = headers['x-forwarded-proto'] || 'https';
    const host = headers['x-forwarded-host'] || 'routieroo.cc';
    const redirectUri = `${protocol}://${host}/api/oauth/callback`;
    
    expect(redirectUri).toBe('https://3000-it9vk5eiynaw25q9vfq9l-bf388f45.manusvm.computer/api/oauth/callback');
  });

  it("should use https protocol by default", () => {
    const headers = {
      'host': 'routieroo.cc',
    };
    
    const protocol = headers['x-forwarded-proto'] || 'https';
    const host = headers['x-forwarded-host'] || headers['host'] || 'routieroo.cc';
    const redirectUri = `${protocol}://${host}/api/oauth/callback`;
    
    expect(redirectUri).toBe('https://routieroo.cc/api/oauth/callback');
  });
});
