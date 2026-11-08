import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setCsrfToken } from "@/lib/api-client";
import { applyTemplate } from "@/config/system-templates";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useSessionStore } from "@/stores/session-store";
import type { SessionResponse } from "@/types/session";
import * as authService from "./service";
import type { LoginValues, RegisterValues } from "./schemas";

export const sessionQueryKey = ["session"] as const;

export function useSessionQuery() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: authService.fetchSession,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function applySession(session: SessionResponse): void {
  setCsrfToken(session.csrfToken);
  useSessionStore.getState().setUser(session.user);
  usePreferencesStore.getState().setTemplate(session.user.template);
  applyTemplate(session.user.template);
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginValues) => authService.login(values),
    onSuccess: (session) => {
      applySession(session);
      queryClient.setQueryData(sessionQueryKey, session);
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (values: RegisterValues) => authService.register(values),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      setCsrfToken(null);
      useSessionStore.getState().clear();
      queryClient.clear();
    },
  });
}
