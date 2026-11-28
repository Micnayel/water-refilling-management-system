import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const notificationSchema = z.object({
  id: z.string(),
  kind: z.string(),
  message: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string().nullable(),
});

export const notificationListSchema = z.object({
  items: z.array(notificationSchema),
});

export type Notification = z.infer<typeof notificationSchema>;

export function listNotifications() {
  return apiRequest("/notifications", { schema: notificationListSchema });
}

export function getUnreadCount() {
  return apiRequest("/notifications/unread-count", { schema: z.object({ count: z.number() }) });
}

export function markNotificationRead(id: string) {
  return apiRequest(`/notifications/${id}/read`, {
    method: "POST",
    body: {},
    schema: z.object({ ok: z.boolean() }),
  });
}
