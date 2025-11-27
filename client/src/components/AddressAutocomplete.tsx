import { Input } from "@/components/ui/input";
import { useEffect, useRef } from "react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  id?: string;
  className?: string;
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
  console.log("[AddressAutocomplete] 🚀 COMPONENT RENDER - id:", id, "value:", value?.substring(0, 20));
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    console.log("[AddressAutocomplete] Component mounted, inputRef:", !!inputRef.current);
    
    if (!inputRef.current || initializedRef.current) {
      console.log("[AddressAutocomplete] Skipping init - no input or already initialized");
      return;
    }

    initializedRef.current = true;

    // Wait a bit for Google Maps to be available
    const timer = setTimeout(() => {
      console.log("[AddressAutocomplete] Checking for Google Maps API...");
      console.log("window.google:", typeof window.google);
      console.log("window.google.maps:", typeof window.google?.maps);
      console.log("window.google.maps.places:", typeof window.google?.maps?.places);

      if (!window.google?.maps?.places) {
        console.error("[AddressAutocomplete] Google Maps Places API not available!");
        initializedRef.current = false;
        return;
      }

      if (!inputRef.current) {
        console.error("[AddressAutocomplete] Input ref lost!");
        initializedRef.current = false;
        return;
      }

      try {
        console.log("[AddressAutocomplete] Initializing autocomplete...");
        
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["formatted_address", "address_components", "geometry"],
        });

        console.log("[AddressAutocomplete] ✅ Initialized successfully!");

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          console.log("[AddressAutocomplete] Place selected:", place);
          if (place?.formatted_address) {
            onChange(place.formatted_address);
            onPlaceSelected?.(place);
          }
        });
      } catch (error) {
        console.error("[AddressAutocomplete] ❌ Initialization failed:", error);
        initializedRef.current = false;
      }
    }, 500); // Wait 500ms for Google Maps to load

    return () => {
      clearTimeout(timer);
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
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
}
