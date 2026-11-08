import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const preferenceSchema = z.object({ template: z.string() });

export const systemSettingsSchema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      version: z.number(),
      updatedAt: z.string().nullable(),
    }),
  ),
});

export function getPreferences() {
  return apiRequest("/settings/preferences", { schema: preferenceSchema });
}

export function saveTemplate(template: string) {
  return apiRequest("/settings/preferences", {
    method: "PUT",
    body: { template },
    schema: preferenceSchema,
  });
}

export function getSystemSettings() {
  return apiRequest("/settings/system", { schema: systemSettingsSchema });
}

export function saveSystemSettings(input: { sessionTimeoutMinutes: number; version?: number }) {
  return apiRequest("/settings/system", {
    method: "PUT",
    body: input,
    schema: z.object({ key: z.string(), value: z.string() }),
  });
}
