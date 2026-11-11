import { isPreviewMode } from "@/lib/preview";
import { useSessionStore, hasGrant } from "@/stores/session-store";

/**
 * Preview mode serves synthetic records. Reads are allowed, plus the two demo
 * add flows (customers and inventory) that stay in this browser session, and
 * the audited-style reveal used to preview exact locations. Other writes and
 * exports stay hidden.
 */
const PREVIEW_EXTRA_GRANTS = new Set([
  "customers:add",
  "customers:reveal",
  "inventory:add",
  "inventory:edit",
]);

function allowInPreview(grant: string): boolean {
  return !isPreviewMode() || grant.endsWith(":view") || PREVIEW_EXTRA_GRANTS.has(grant);
}

export function usePermission(grant: string): boolean {
  const user = useSessionStore((state) => state.user);
  return allowInPreview(grant) && hasGrant(user, grant);
}

export function useAnyPermission(grants: string[]): boolean {
  const user = useSessionStore((state) => state.user);
  return grants.some((grant) => allowInPreview(grant) && hasGrant(user, grant));
}
