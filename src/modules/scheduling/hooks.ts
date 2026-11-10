import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Schedule, ScheduleFormValues } from "./schemas";
import * as service from "./service";

export const scheduleKeys = {
  list: ["schedules", "list"] as const,
  detail: (id: string) => ["schedules", "detail", id] as const,
  assignees: ["schedules", "assignees"] as const,
};

export function useScheduleCalendar(from: string, to: string, status: string) {
  return useQuery({
    queryKey: [...scheduleKeys.list, "calendar", from, to, status],
    queryFn: async () => {
      const items: Schedule[] = [];
      let cursor: string | undefined;
      // A month can exceed one page; walk every page so the calendar is complete.
      for (let page = 0; page < 10; page += 1) {
        const result = await service.querySchedules({
          cursor,
          pageSize: 100,
          status: status || undefined,
          from,
          to,
        });
        items.push(...result.items);
        if (!result.nextCursor) break;
        cursor = result.nextCursor;
      }
      return { items };
    },
    placeholderData: (previous) => previous,
  });
}

export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: scheduleKeys.detail(id ?? "none"),
    queryFn: () => service.getSchedule(id as string),
    enabled: Boolean(id),
  });
}

export function useAssignees() {
  return useQuery({
    queryKey: scheduleKeys.assignees,
    queryFn: service.listAssignees,
    staleTime: 60_000,
  });
}

function useInvalidateSchedules() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["schedules"] });
    void queryClient.invalidateQueries({ queryKey: ["inventory"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
  };
}

export function useCreateSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: (values: ScheduleFormValues) => service.createSchedule(values),
    onSuccess: invalidate,
  });
}

export function useUpdateSchedule(id: string) {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: (values: ScheduleFormValues & { version: number }) =>
      service.updateSchedule(id, values),
    onSuccess: invalidate,
  });
}

export function useChangeStatus(id: string) {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: (input: { status: string; version: number; itemId?: string }) =>
      service.changeStatus(id, input),
    onSuccess: invalidate,
  });
}
