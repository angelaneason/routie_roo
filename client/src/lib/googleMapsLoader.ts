/**
 * Shared Google Maps API loader
 * Ensures the API is loaded only once and can be used across multiple components
 */

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY || "";
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

let loadPromise: Promise<void> | null = null;
let isLoaded = false;

/**
 * Load the Google Maps JavaScript API
 * Returns a promise that resolves when the API is ready
 * Subsequent calls return the same promise (singleton pattern)
 */
export function loadGoogleMapsAPI(): Promise<void> {
  // If already loaded, resolve immediately
  if (isLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (loadPromise) {
    return loadPromise;
  }

  // Start loading
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      isLoaded = true;
      console.log("[GoogleMaps] API loaded successfully");
      resolve();
      script.remove(); // Clean up
    };
    
    script.onerror = () => {
      console.error("[GoogleMaps] Failed to load API");
      loadPromise = null; // Allow retry
      reject(new Error("Failed to load Google Maps API"));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Check if Google Maps API is already loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return isLoaded && !!window.google?.maps;
}
