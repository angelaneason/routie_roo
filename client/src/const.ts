export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/routieroo.png";

// Generate login URL for Google OAuth directly
export const getLoginUrl = () => {
  // Use direct Google OAuth instead of Manus portal
  const redirectUri = `${window.location.origin}/api/oauth/google`;
  return redirectUri;
};
