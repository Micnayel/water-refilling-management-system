import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const auditEventSchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  event: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  detail: z.string(),
  createdAt: z.string().nullable(),
});

export const auditPageSchema = z.object({
  items: z.array(auditEventSchema),
  nextCursor: z.string().nullable(),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

export interface AuditQuery {
  cursor?: string;
  pageSize: number;
  event?: string;
}

export function queryAudit(input: AuditQuery) {
  return apiRequest("/audit/query", {
    method: "POST",
    body: {
      cursor: input.cursor,
      pageSize: input.pageSize,
      event: input.event || undefined,
    },
    schema: auditPageSchema,
  });
}

export const AUDIT_EVENT_OPTIONS = [
  "ACCESS",
  "AUTH_APPROVE",
  "AUTH_LOGIN",
  "AUTH_LOGIN_FAILED",
  "AUTH_LOGOUT",
  "AUTH_REGISTER",
  "CUSTOMER_CREATE",
  "CUSTOMER_DELETE",
  "CUSTOMER_EXPORT",
  "CUSTOMER_UPDATE",
  "HEATMAP_EXPORT",
  "INVENTORY_CREATE",
  "INVENTORY_EXPORT",
  "INVENTORY_UPDATE",
  "REPORTS_EXPORT",
  "SCHEDULE_CREATE",
  "SCHEDULE_EXPORT",
  "SCHEDULE_UPDATE",
  "SETTINGS_UPDATE",
  "USER_CREATE",
  "USER_DELETE",
  "USER_EXPORT",
  "USER_UPDATE",
] as const;
