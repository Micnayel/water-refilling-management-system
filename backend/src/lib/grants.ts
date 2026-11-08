export const ALL_GRANTS = [
  "dashboard:view",
  "dashboard:export",
  "heatmap:view",
  "heatmap:export",
  "inventory:view",
  "inventory:add",
  "inventory:edit",
  "inventory:delete",
  "inventory:export",
  "customers:view",
  "customers:add",
  "customers:edit",
  "customers:delete",
  "customers:export",
  "customers:reveal",
  "scheduling:view",
  "scheduling:add",
  "scheduling:edit",
  "scheduling:delete",
  "scheduling:export",
  "admin:view",
  "admin:add",
  "admin:edit",
  "admin:delete",
  "admin:export",
  "reports:view",
  "reports:export",
  "audit:view",
  "notifications:view",
  "settings:view",
  "settings:edit",
] as const;

export type Grant = (typeof ALL_GRANTS)[number];

export function parseGrants(value: string): Grant[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is Grant =>
      typeof entry === "string" && (ALL_GRANTS as readonly string[]).includes(entry),
    );
  } catch {
    return [];
  }
}
