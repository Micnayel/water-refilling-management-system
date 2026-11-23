import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isPreviewMode } from "@/lib/preview";

/**
 * The role workspaces read synthetic records only. They stay unavailable on a
 * production build, where the standard API-backed modules are the source of
 * truth.
 */
export function PreviewOnlyRoute({ children }: { children: ReactNode }) {
  if (!isPreviewMode()) return <Navigate to="/" replace />;
  return <>{children}</>;
}
