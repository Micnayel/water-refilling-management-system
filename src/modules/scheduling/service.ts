import { apiRequest } from "@/lib/api-client";
import {
  assigneeListSchema,
  schedulePageSchema,
  scheduleSchema,
  type Schedule,
  type ScheduleFormValues,
} from "./schemas";

export function querySchedules(input: {
  cursor?: string;
  pageSize: number;
  status?: string;
  date?: string;
}): Promise<{ items: Schedule[]; nextCursor: string | null }> {
  return apiRequest("/schedules/query", {
    method: "POST",
    body: input,
    schema: schedulePageSchema,
  });
}

export function getSchedule(id: string): Promise<Schedule> {
  return apiRequest(`/schedules/${id}`, { schema: scheduleSchema });
}

export function createSchedule(values: ScheduleFormValues): Promise<Schedule> {
  return apiRequest("/schedules", {
    method: "POST",
    body: values,
    schema: scheduleSchema,
  });
}

export function updateSchedule(id: string, values: ScheduleFormValues & { version: number }) {
  return apiRequest(`/schedules/${id}`, {
    method: "PATCH",
    body: values,
    schema: scheduleSchema,
  });
}

export function changeStatus(
  id: string,
  input: { status: string; version: number; itemId?: string },
): Promise<Schedule> {
  return apiRequest(`/schedules/${id}/status`, {
    method: "POST",
    body: input,
    schema: scheduleSchema,
  });
}

export function listAssignees() {
  return apiRequest("/schedules/assignees", { schema: assigneeListSchema });
}
