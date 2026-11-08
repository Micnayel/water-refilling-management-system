import { useSessionStore, hasGrant } from "@/stores/session-store";

export function usePermission(grant: string): boolean {
  return useSessionStore((state) => hasGrant(state.user, grant));
}

export function useAnyPermission(grants: string[]): boolean {
  return useSessionStore((state) => grants.some((grant) => hasGrant(state.user, grant)));
}
