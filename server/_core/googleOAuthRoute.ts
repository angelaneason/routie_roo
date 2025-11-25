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

  const userId = parseInt(state, 10);
  if (isNaN(userId)) {
    return res.status(400).send("Invalid state parameter");
  }

  try {
    // Use public URL from ENV to avoid internal Azure container address
    const { ENV } = await import("./env");
    const redirectUri = `${ENV.publicUrl}/api/oauth/google/callback`;

    // Create a tRPC caller
    const caller = appRouter.createCaller({
      req,
      res,
      user: null, // Public procedure
    });

    // Handle the callback
    await caller.contacts.handleGoogleCallback({
      code,
      userId,
      redirectUri,
    });

    // Redirect back to the app with success message
    res.redirect("/?sync=success");
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect("/?sync=error");
  }
});

googleOAuthRouter.get("/api/oauth/google/calendar-callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing authorization code");
  }

  if (!state || typeof state !== "string") {
    return res.status(400).send("Missing state parameter");
  }

  try {
    const stateData = JSON.parse(state);
    const { userId, routeId, startTime } = stateData;

    // Use public URL from ENV to avoid internal Azure container address
    const { ENV } = await import("./env");
    const redirectUri = `${ENV.publicUrl}/api/oauth/google/calendar-callback`;

    // Import necessary functions
    const { exchangeCodeForToken, createCalendarEvent } = await import("../googleAuth");
    const { getRouteById, getRouteWaypoints } = await import("../db");

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code, redirectUri);
    
    // Get route details
    const route = await getRouteById(routeId);
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
    console.error("Calendar OAuth callback error:", error);
    res.status(500).send("Failed to create calendar event");
  }
});
