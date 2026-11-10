import { isPreviewMode } from "@/lib/preview";
import { useSessionStore, hasGrant } from "@/stores/session-store";

/**
 * Preview mode is read-only: it serves synthetic records, so every non-view
 * grant is denied and the write, export, and reveal controls stay hidden.
 */
function allowInPreview(grant: string): boolean {
  return !isPreviewMode() || grant.endsWith(":view");
}

export function usePermission(grant: string): boolean {
  const user = useSessionStore((state) => state.user);
  return allowInPreview(grant) && hasGrant(user, grant);
}

export function useAnyPermission(grants: string[]): boolean {
  const user = useSessionStore((state) => state.user);
  return grants.some((grant) => allowInPreview(grant) && hasGrant(user, grant));
}
