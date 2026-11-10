/**
 * Preview mode renders synthetic records so the workspace can be reviewed
 * without touching the live database. It is opt-in at build time through
 * `VITE_PREVIEW_DATA=true` and is always read-only: only `:view` grants are
 * honoured, so create, edit, delete, export, and reveal controls stay hidden.
 */
export function isPreviewMode(): boolean {
  return import.meta.env.VITE_PREVIEW_DATA === "true";
}
