/**
 * Preview mode renders synthetic records so the workspace can be reviewed
 * without touching the live database. It is opt-in at build time through
 * `VITE_PREVIEW_DATA=true`. Reads are served from fixtures, plus in-memory
 * demo adds for customers and stock and an in-browser reveal. Nothing is
 * written to the database.
 */
export function isPreviewMode(): boolean {
  return import.meta.env.VITE_PREVIEW_DATA === "true";
}
