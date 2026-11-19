import { z } from "zod";

export const stationLocationSchema = z.object({
  label: z.string().trim().max(120, "Keep the label under 120 characters."),
  latitude: z
    .number({ invalid_type_error: "Enter the latitude." })
    .min(-90, "Latitude must be between -90 and 90.")
    .max(90, "Latitude must be between -90 and 90."),
  longitude: z
    .number({ invalid_type_error: "Enter the longitude." })
    .min(-180, "Longitude must be between -180 and 180.")
    .max(180, "Longitude must be between -180 and 180."),
});

export const stationLocationResponseSchema = z.object({
  label: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  version: z.number(),
});

export type StationLocationValues = z.infer<typeof stationLocationSchema>;
export type StationLocation = z.infer<typeof stationLocationResponseSchema>;
