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

let mapsLoadingPromise: Promise<void> | null = null;
let mapsLoaded = false;

function loadMapScript(): Promise<void> {
  if (mapsLoaded) {
    return Promise.resolve();
  }
  
  if (mapsLoadingPromise) {
    return mapsLoadingPromise;
  }

  mapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      mapsLoaded = true;
      resolve();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      mapsLoadingPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return mapsLoadingPromise;
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

  useEffect(() => {
    let mounted = true;

    async function initAutocomplete() {
      try {
        // Load Google Maps script first
        await loadMapScript();

        if (!mounted || !inputRef.current) {
          return;
        }

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

        setIsLoading(false);
      } catch (error) {
        console.error("[AddressAutocomplete] Failed to initialize:", error);
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

  return (
    <Input
      ref={inputRef}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isLoading ? "Loading..." : placeholder}
      className={className}
      autoComplete="off"
      disabled={isLoading}
    />
  );
}
