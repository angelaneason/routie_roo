/**
 * Convert distance between kilometers and miles
 */
export function convertDistance(distanceKm: number, unit: "km" | "miles"): number {
  if (unit === "miles") {
    return distanceKm * 0.621371; // Convert km to miles
  }
  return distanceKm;
}

/**
 * Format distance with appropriate unit
 */
export function formatDistance(distanceKm: number, unit: "km" | "miles"): string {
  const converted = convertDistance(distanceKm, unit);
  return `${converted.toFixed(1)} ${unit}`;
}
