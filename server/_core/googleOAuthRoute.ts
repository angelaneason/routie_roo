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
