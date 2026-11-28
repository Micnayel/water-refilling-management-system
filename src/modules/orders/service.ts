import { apiRequest } from "@/lib/api-client";
import { schedulePageSchema, scheduleSchema, type Schedule } from "@/modules/scheduling";

export function queryOrders(input: {
  cursor?: string;
  pageSize?: number;
  status?: string;
  from?: string;
  to?: string;
}) {
  return apiRequest("/schedules/query", { method: "POST", body: input, schema: schedulePageSchema });
}

export function getOrder(id: string): Promise<Schedule> {
  return apiRequest(`/schedules/${id}`, { schema: scheduleSchema });
}
