import { Router } from "express";
import { appRouter } from "../routers";

export const googleOAuthRouter = Router();

googleOAuthRouter.get("/api/oauth/google/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing authorization code");
  }

  if (!state || typeof state !== "string") {
    return res.status(400).send("Missing state parameter");
  }

  try {
    const stateData = JSON.parse(state);
    const userId = stateData.userId;
    const action = stateData.action || 'contacts'; // 'contacts' or 'calendar'

    // Use public URL from ENV to avoid internal Azure container address
    const { ENV } = await import("./env");
    const redirectUri = `${ENV.publicUrl}/api/oauth/google/callback`;

    if (action === 'calendar') {
      // Calendar connection flow
      const { exchangeCodeForToken } = await import("../googleAuth");
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Exchange code for token
      const tokenData = await exchangeCodeForToken(code, redirectUri);
      
      // Store tokens in database
      const db = await getDb();
      if (db) {
        const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000);
        
        // Fetch calendar list from Google Calendar API
        const { getCalendarList } = await import("../googleAuth");
        let calendarListJson = null;
        try {
          const calendars = await getCalendarList(tokenData.access_token);
          // Store as JSON: array of { id, summary, backgroundColor }
          calendarListJson = JSON.stringify(calendars.map((cal: any) => ({
            id: cal.id,
            summary: cal.summary,
            backgroundColor: cal.backgroundColor || '#3b82f6', // Default blue
          })));
          console.log('[OAuth] Fetched and stored', calendars.length, 'calendars');
        } catch (error) {
          console.error('[OAuth] Failed to fetch calendar list:', error);
          // Continue anyway - user can refresh later
        }
        
        await db.update(users)
          .set({
            googleCalendarAccessToken: tokenData.access_token,
            googleCalendarRefreshToken: tokenData.refresh_token || null,
            googleCalendarTokenExpiry: expiryDate,
            googleCalendarList: calendarListJson,
          })
          .where(eq(users.id, userId));
      }

      // Redirect back to settings with success message
      res.redirect("/settings?calendar_connected=true");
    } else {
      // Contacts sync flow (original behavior)
      console.log('[OAuth] Starting contacts sync for userId:', userId);
      
      // Create a tRPC caller
      const caller = appRouter.createCaller({
        req,
        res,
        user: null, // Public procedure
      });

      // Handle the callback
      console.log('[OAuth] Calling handleGoogleCallback...');
      const result = await caller.contacts.handleGoogleCallback({
        code,
        userId,
        redirectUri,
      });
      console.log('[OAuth] Sync completed. Result:', result);

      // Redirect back to the app with success message
      res.redirect("/?sync=success");
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    
    // Try to parse state to determine redirect
    try {
      const stateData = JSON.parse(state);
      if (stateData.action === 'calendar') {
        res.redirect("/settings?calendar_connected=false");
      } else {
        res.redirect("/?sync=error");
      }
    } catch {
      res.redirect("/?sync=error");
    }
  }
});

// Calendar connection callback (for Settings page)
googleOAuthRouter.get("/api/oauth/google/calendar-connect", async (req, res) => {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing authorization code");
  }

  if (!state || typeof state !== "string") {
    return res.status(400).send("Missing state parameter");
  }

  try {
    const stateData = JSON.parse(state);
    const { userId } = stateData;

    // Use public URL from ENV to avoid internal Azure container address
    const { ENV } = await import("./env");
    const redirectUri = `${ENV.publicUrl}/api/oauth/google/calendar-connect`;

    // Import necessary functions
    const { exchangeCodeForToken } = await import("../googleAuth");
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    
    // Store tokens in database
    const db = await getDb();
    if (db) {
      const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000);
      await db.update(users)
        .set({
          googleCalendarAccessToken: tokenData.access_token,
          googleCalendarRefreshToken: tokenData.refresh_token || null,
          googleCalendarTokenExpiry: expiryDate,
        })
        .where(eq(users.id, userId));
    }

    // Redirect back to settings with success message
    res.redirect("/settings?calendar_connected=true");
  } catch (error) {
    console.error("[Calendar Connect] Callback error:", error);
    res.redirect("/settings?calendar_connected=false");
  }
});

// Calendar event creation callback (for scheduling routes)
googleOAuthRouter.get("/api/oauth/google/calendar-callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing authorization code");
  }

  if (!state || typeof state !== "string") {
    return res.status(400).send("Missing state parameter");
  }

  let routeId: number | undefined;
  let startTime: string | undefined;

  try {
    const stateData = JSON.parse(state);
    const { userId } = stateData;
    routeId = stateData.routeId;
    startTime = stateData.startTime;

    // Use public URL from ENV to avoid internal Azure container address
    const { ENV } = await import("./env");
    const redirectUri = `${ENV.publicUrl}/api/oauth/google/calendar-callback`;

    // Import necessary functions
    const { exchangeCodeForToken, createCalendarEvent } = await import("../googleAuth");
    const { getRouteById, getRouteWaypoints } = await import("../db");

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    
    // Get route details
    const route = await getRouteById(routeId!);
    if (!route || route.userId !== userId) {
      return res.status(404).send("Route not found");
    }

    // Fetch user's calendar list
    const { getCalendarList } = await import("../googleAuth");
    const calendars = await getCalendarList(tokenData.access_token);

    // Store token and calendar data temporarily (in a real app, use session or database)
    // For now, redirect back to app with calendar data in URL params
    const calendarData = encodeURIComponent(JSON.stringify({
      calendars,
      routeId,
      startTime,
      accessToken: tokenData.access_token, // WARNING: This is not secure for production
    }));

    // Redirect back to Routie Roo with calendar selection dialog
    res.redirect(`/?calendar_auth=success&data=${calendarData}`);
  } catch (error) {
    console.error("[Calendar OAuth] Callback error:", error);
    console.error("[Calendar OAuth] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      routeId,
      startTime,
    });
    res.status(500).send(`Failed to create calendar event: ${error instanceof Error ? error.message : String(error)}`);
  }
});
