import { makeRequest, GeocodingResult } from "./_core/map";

export type AddressValidationResult = {
  isValid: boolean;
  formattedAddress?: string;
  suggestions?: string[];
  error?: string;
};

/**
 * Validate an address using Google Maps Geocoding API
 * Returns formatted address if valid, suggestions if partially valid, or error if invalid
 */
export async function validateAddress(address: string): Promise<AddressValidationResult> {
  if (!address || address.trim().length === 0) {
    return {
      isValid: false,
      error: "Address cannot be empty",
    };
  }

  try {
    const result = await makeRequest<GeocodingResult>("/maps/api/geocode/json", {
      address: address.trim(),
    });

    if (result.status === "OK" && result.results.length > 0) {
      const topResult = result.results[0];
      
      // Check if this is a high-quality match
      const isHighQuality = topResult.geometry.location_type === "ROOFTOP" || 
                           topResult.geometry.location_type === "RANGE_INTERPOLATED";

      // If we have multiple results, provide suggestions
      const suggestions = result.results.slice(0, 3).map(r => r.formatted_address);

      return {
        isValid: true,
        formattedAddress: topResult.formatted_address,
        suggestions: suggestions.length > 1 ? suggestions : undefined,
      };
    } else if (result.status === "ZERO_RESULTS") {
      return {
        isValid: false,
        error: "Address not found. Please check the address and try again.",
      };
    } else {
      return {
        isValid: false,
        error: `Unable to validate address: ${result.status}`,
      };
    }
  } catch (error) {
    console.error("[AddressValidation] Error validating address:", error);
    return {
      isValid: false,
      error: "Failed to validate address. Please try again.",
    };
  }
}
