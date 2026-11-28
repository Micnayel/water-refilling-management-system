import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hasGrant, useSessionStore } from "@/stores/session-store";
import * as service from "./service";

export const notificationKeys = {
  list: ["notifications"] as const,
  unread: ["notifications", "unread-count"] as const,
};

export function useNotifications(enabled = true) {
  return useQuery({ queryKey: notificationKeys.list, queryFn: service.listNotifications, enabled });
}

export function useUnreadNotificationCount(enabled = true) {
  const canView = useSessionStore((state) => hasGrant(state.user, "notifications:view"));
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: service.getUnreadCount,
    enabled: enabled && canView,
    refetchInterval: 30_000,
    select: (data) => data.count,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => service.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}
