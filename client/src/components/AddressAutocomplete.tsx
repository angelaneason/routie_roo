import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// Track if the script has been loaded globally
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: Array<() => void> = [];

function loadMapScript(): Promise<void> {
  // If already loaded, resolve immediately
  if (scriptLoaded && window.google?.maps?.places) {
    return Promise.resolve();
  }

  // If currently loading, wait for it
  if (scriptLoading) {
    return new Promise((resolve) => {
      loadCallbacks.push(() => resolve());
    });
  }

  // Start loading
  scriptLoading = true;
  
  const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
  console.log("[AddressAutocomplete] Loading script from:", scriptUrl);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    
    console.log("[AddressAutocomplete] Script element created, appending to head...");
    
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      
      // Notify all waiting callbacks
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
      
      resolve();
    };
    
    script.onerror = (error) => {
      console.error("[AddressAutocomplete] Failed to load Google Maps script:", error);
      scriptLoading = false;
      
      // Notify all waiting callbacks anyway
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
      
      resolve(); // Resolve anyway to prevent hanging
    };
    
    document.head.appendChild(script);
    console.log("[AddressAutocomplete] Script appended to document.head");
  });
}

/**
 * Address input with Google Places Autocomplete
 * Provides address suggestions as user types, powered by Google Maps
 */
export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Enter address",
  id,
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initAutocomplete() {
      try {
        console.log("[AddressAutocomplete] Starting initialization...");
        
        // Load Google Maps script first
        await loadMapScript();

        if (!mounted) {
          console.log("[AddressAutocomplete] Component unmounted during load");
          return;
        }

        // Verify Google Maps API is available
        if (!window.google?.maps?.places) {
          console.error("[AddressAutocomplete] Google Maps Places API not available!");
          setError(true);
          setIsLoading(false);
          return;
        }

        if (!inputRef.current) {
          console.error("[AddressAutocomplete] Input ref not available");
          setError(true);
          setIsLoading(false);
          return;
        }

        console.log("[AddressAutocomplete] Initializing Autocomplete...");

        // Initialize autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["formatted_address", "address_components", "geometry"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address);
            onPlaceSelected?.(place);
          }
        });

        console.log("[AddressAutocomplete] Initialization complete!");
        setIsLoading(false);
      } catch (err) {
        console.error("[AddressAutocomplete] Failed to initialize:", err);
        setError(true);
        setIsLoading(false);
      }
    }

    initAutocomplete();

    return () => {
      mounted = false;
      if (autocompleteRef.current) {
        window.google?.maps?.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange, onPlaceSelected]);

  if (error) {
    return (
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isLoading ? "Loading address autocomplete..." : placeholder}
      className={className}
      autoComplete="off"
      disabled={isLoading}
    />
  );
}
