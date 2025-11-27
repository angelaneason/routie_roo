import { describe, expect, it, vi, beforeEach } from "vitest";
import { validateAddress } from "./addressValidation";
import * as mapModule from "./_core/map";

// Mock the map module
vi.mock("./_core/map", () => ({
  makeRequest: vi.fn(),
}));

describe("Address Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for empty address", async () => {
    const result = await validateAddress("");
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Address cannot be empty");
  });

  it("should return error for whitespace-only address", async () => {
    const result = await validateAddress("   ");
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Address cannot be empty");
  });

  it("should return valid result for valid address", async () => {
    const mockResponse = {
      status: "OK",
      results: [
        {
          formatted_address: "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
          geometry: {
            location: { lat: 37.4224764, lng: -122.0842499 },
            location_type: "ROOFTOP",
          },
          address_components: [],
          place_id: "ChIJ2eUgeAK6j4ARbn5u_wAGqWA",
          types: ["street_address"],
        },
      ],
    };

    vi.mocked(mapModule.makeRequest).mockResolvedValueOnce(mockResponse);

    const result = await validateAddress("1600 Amphitheatre Parkway, Mountain View, CA");
    
    expect(result.isValid).toBe(true);
    expect(result.formattedAddress).toBe("1600 Amphitheatre Parkway, Mountain View, CA 94043, USA");
    expect(mapModule.makeRequest).toHaveBeenCalledWith(
      "/maps/api/geocode/json",
      { address: "1600 Amphitheatre Parkway, Mountain View, CA" }
    );
  });

  it("should return suggestions when multiple results exist", async () => {
    const mockResponse = {
      status: "OK",
      results: [
        {
          formatted_address: "123 Main St, Springfield, IL 62701, USA",
          geometry: {
            location: { lat: 39.7817, lng: -89.6501 },
            location_type: "ROOFTOP",
          },
          address_components: [],
          place_id: "place1",
          types: ["street_address"],
        },
        {
          formatted_address: "123 Main St, Springfield, MA 01103, USA",
          geometry: {
            location: { lat: 42.1015, lng: -72.5898 },
            location_type: "ROOFTOP",
          },
          address_components: [],
          place_id: "place2",
          types: ["street_address"],
        },
        {
          formatted_address: "123 Main St, Springfield, MO 65806, USA",
          geometry: {
            location: { lat: 37.2090, lng: -93.2923 },
            location_type: "ROOFTOP",
          },
          address_components: [],
          place_id: "place3",
          types: ["street_address"],
        },
      ],
    };

    vi.mocked(mapModule.makeRequest).mockResolvedValueOnce(mockResponse);

    const result = await validateAddress("123 Main St, Springfield");
    
    expect(result.isValid).toBe(true);
    expect(result.formattedAddress).toBe("123 Main St, Springfield, IL 62701, USA");
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions).toContain("123 Main St, Springfield, IL 62701, USA");
    expect(result.suggestions).toContain("123 Main St, Springfield, MA 01103, USA");
    expect(result.suggestions).toContain("123 Main St, Springfield, MO 65806, USA");
  });

  it("should return error for invalid address", async () => {
    const mockResponse = {
      status: "ZERO_RESULTS",
      results: [],
    };

    vi.mocked(mapModule.makeRequest).mockResolvedValueOnce(mockResponse);

    const result = await validateAddress("asdfasdfasdfasdf");
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Address not found. Please check the address and try again.");
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(mapModule.makeRequest).mockRejectedValueOnce(new Error("Network error"));

    const result = await validateAddress("123 Main St");
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Failed to validate address. Please try again.");
  });

  it("should handle non-OK status from API", async () => {
    const mockResponse = {
      status: "REQUEST_DENIED",
      results: [],
    };

    vi.mocked(mapModule.makeRequest).mockResolvedValueOnce(mockResponse);

    const result = await validateAddress("123 Main St");
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Unable to validate address: REQUEST_DENIED");
  });
});
