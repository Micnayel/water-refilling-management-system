import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./service";

import type { StationLocationValues } from "./schemas";

export const settingsKeys = {
  preferences: ["settings", "preferences"] as const,
  system: ["settings", "system"] as const,
  station: ["settings", "station"] as const,
};

export function usePreferences() {
  return useQuery({ queryKey: settingsKeys.preferences, queryFn: service.getPreferences });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (template: string) => service.saveTemplate(template),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.preferences }),
  });
}

export function useSystemSettings() {
  return useQuery({ queryKey: settingsKeys.system, queryFn: service.getSystemSettings });
}

export function useStationLocation() {
  return useQuery({
    queryKey: settingsKeys.station,
    queryFn: service.getStationLocation,
    staleTime: 5 * 60_000,
  });
}

export function useSaveStationLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: StationLocationValues & { version?: number }) =>
      service.saveStationLocation(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.station }),
  });
}

export function useSaveSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.saveSystemSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.system }),
  });
}
