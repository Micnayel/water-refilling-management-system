import { useQuery } from "@tanstack/react-query";
import type { HeatQuery } from "./schemas";
import * as service from "./service";

export const heatMapKeys = {
  points: (input: HeatQuery) => ["heat-map", input] as const,
};

export function useHeatPoints(input: HeatQuery) {
  return useQuery({
    queryKey: heatMapKeys.points(input),
    queryFn: () => service.getHeatPoints(input),
    placeholderData: (previous) => previous,
  });
}
