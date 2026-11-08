import { apiRequest } from "@/lib/api-client";
import { heatQuerySchema, heatResultSchema, type HeatQuery } from "./schemas";

export function getHeatPoints(input: HeatQuery) {
  return apiRequest("/heat-map/points", {
    method: "POST",
    body: heatQuerySchema.parse(input),
    schema: heatResultSchema,
  });
}
