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
    const protocol = req.protocol || 'https';
    const host = req.headers.host || '';
    const redirectUri = `${protocol}://${host}/api/oauth/google/callback`;

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

    const waypoints = await getRouteWaypoints(routeId);
    const waypointsList = waypoints.map((wp, i) => `${i + 1}. ${wp.contactName || wp.address}`).join('\n');
    
    // Calculate end time based on route duration
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + (route.totalDuration! * 1000));

    const description = [
      route.notes || '',
      '',
      'Waypoints:',
      waypointsList,
      '',
      `Total Distance: ${(route.totalDistance! / 1000).toFixed(1)} km`,
      `Estimated Duration: ${Math.round(route.totalDuration! / 60)} minutes`,
    ].filter(Boolean).join('\n');

    // Create calendar event
    const { htmlLink } = await createCalendarEvent(
      tokenData.access_token,
      {
        summary: route.name,
        description,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        location: waypoints[0]?.address,
      }
    );

    // Redirect to the calendar event
    res.redirect(htmlLink);
  } catch (error) {
    console.error("Calendar OAuth callback error:", error);
    res.status(500).send("Failed to create calendar event");
  }
});
