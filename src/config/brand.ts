export const brand = {
  productName: "Water Refilling Management System",
  shortName: "WRMS",
  stationName: "Water Refilling Station",
  supportNote: "Internal and proprietary. For approved staff use only.",
} as const;

/**
 * Provisional dispatch origin used to draw in-app routes. Replace with the
 * station's registered coordinates once they are confirmed.
 */
export const stationLocation = {
  latitude: 14.676,
  longitude: 121.0437,
} as const;
