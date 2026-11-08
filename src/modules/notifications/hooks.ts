import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./service";

export const notificationKeys = {
  list: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({ queryKey: notificationKeys.list, queryFn: service.listNotifications });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => service.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
  });
}
