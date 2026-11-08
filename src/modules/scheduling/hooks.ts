import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScheduleFormValues } from "./schemas";
import * as service from "./service";

export const scheduleKeys = {
  list: ["schedules", "list"] as const,
  detail: (id: string) => ["schedules", "detail", id] as const,
  assignees: ["schedules", "assignees"] as const,
};

export function useScheduleList(
  page: number,
  pageSize: number,
  status: string,
  date: string,
) {
  const cursor = page <= 1 ? undefined : String((page - 1) * pageSize);
  return useQuery({
    queryKey: [...scheduleKeys.list, cursor ?? "start", pageSize, status, date],
    queryFn: () =>
      service.querySchedules({
        cursor,
        pageSize,
        status: status || undefined,
        date: date || undefined,
      }),
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
