import { useMutation, useQuery } from "@tanstack/react-query";
import * as service from "./service";

export const dashboardKeys = {
  summary: ["dashboard", "summary"] as const,
  map: ["dashboard", "map"] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: service.getSummary,
  });
}

export function useDashboardMap() {
  return useQuery({
    queryKey: dashboardKeys.map,
    queryFn: service.getMap,
  });
}

export function useRevealDashboardCustomer() {
  return useMutation({ mutationFn: service.revealCustomer });
}
