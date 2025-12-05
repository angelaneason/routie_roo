import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { SignJWT } from "jose";
import { google } from "googleapis";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Initialize Google OAuth2 client (redirect URI set dynamically per request)
function getOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}

export function registerOAuthRoutes(app: Express) {
  // Initiate Google OAuth flow
  app.get("/api/oauth/google", async (req: Request, res: Response) => {
    try {
      // Use public URL from ENV to avoid internal Azure container address
      const redirectUri = `${ENV.publicUrl}/api/oauth/callback`;
      const oauth2Client = getOAuth2Client(redirectUri);

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/contacts.readonly",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/calendar.readonly",
        ],
        prompt: "consent",
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error("[OAuth] Failed to generate auth URL", error);
      res.status(500).json({ error: "Failed to initiate OAuth" });
    }
  });

  // Handle Google OAuth callback
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log("[OAuth] Callback received");
    const code = getQueryParam(req, "code");
    
    // Helper to log login attempts
    const logLoginAttempt = async (data: {
      userId?: number;
      email?: string;
      success: boolean;
      failureReason?: string;
      loginMethod: string;
    }) => {
      try {
        const { getDb } = await import("../db");
        const { loginAttempts } = await import("../../drizzle/schema");
        const database = await getDb();
        if (database) {
          await database.insert(loginAttempts).values({
            userId: data.userId || null,
            email: data.email || null,
            success: data.success,
            failureReason: data.failureReason || null,
            ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null,
            loginMethod: data.loginMethod,
          });
        }
      } catch (error) {
        console.error("[OAuth] Failed to log login attempt:", error);
      }
    };

    if (!code) {
      console.log("[OAuth] No code provided");
      await logLoginAttempt({
        success: false,
        failureReason: "missing_authorization_code",
        loginMethod: "google",
      });
      res.status(400).json({ error: "code is required" });
      return;
    }

    console.log("[OAuth] Code received, starting token exchange");
    try {
      // Use public URL from ENV to avoid internal Azure container address
      const redirectUri = `${ENV.publicUrl}/api/oauth/callback`;
      const oauth2Client = getOAuth2Client(redirectUri);

      // Exchange code for tokens
      console.log("[OAuth] Exchanging code for tokens...");
      const { tokens } = await oauth2Client.getToken(code);
      console.log("[OAuth] Tokens received successfully");
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      console.log("[OAuth] Fetching user info from Google...");
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();
      console.log("[OAuth] User info received:", { id: userInfo.id, email: userInfo.email, name: userInfo.name });

      if (!userInfo.id) {
        await logLoginAttempt({
          email: userInfo.email || undefined,
          success: false,
          failureReason: "missing_user_id_from_google",
          loginMethod: "google",
        });
        res.status(400).json({ error: "User ID missing from Google response" });
        return;
      }

      // Create or update user in database
      console.log("[OAuth] Upserting user to database...");
      await db.upsertUser({
        openId: `google_${userInfo.id}`, // Prefix to distinguish from Manus IDs
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      console.log("[OAuth] User upserted successfully");
      
      // Get user ID for login tracking
      const { getUserByOpenId } = await import("../db");
      const user = await getUserByOpenId(`google_${userInfo.id}`);
      
      // Log successful login
      await logLoginAttempt({
        userId: user?.id,
        email: userInfo.email || undefined,
        success: true,
        loginMethod: "google",
      });

      // Create session token (JWT)
      console.log("[OAuth] Creating session token...");
      const secretKey = new TextEncoder().encode(ENV.jwtSecret);
      const sessionToken = await new SignJWT({
          openId: `google_${userInfo.id}`,
          appId: ENV.appId,
          name: userInfo.name || "",
        })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime("365d")
        .sign(secretKey);
      console.log("[OAuth] Session token created successfully");

      // Set session cookie
      console.log("[OAuth] Setting session cookie...");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[OAuth] Session cookie set, redirecting to home page");

      // Store Google tokens for later use (contacts, calendar)
      // TODO: Store refresh token in database for long-term access
      if (tokens.refresh_token) {
        // For now, we'll handle this in the contacts/calendar sync procedures
        console.log("[OAuth] Received refresh token for user", userInfo.id);
      }

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed with error:", error);
      console.error("[OAuth] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Log failed login attempt
      await logLoginAttempt({
        success: false,
        failureReason: error instanceof Error ? error.message : "unknown_error",
        loginMethod: "google",
      });
      
      res.status(500).json({ error: "OAuth callback failed", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Legacy Manus OAuth callback (kept for backward compatibility)
  app.get("/api/oauth/manus-callback", async (req: Request, res: Response) => {
    res.status(410).json({ 
      error: "Manus OAuth is no longer supported. Please use Google OAuth." 
    });
  });
}
