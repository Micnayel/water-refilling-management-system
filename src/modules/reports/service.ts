import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const reportSchema = z.object({
  from: z.string(),
  to: z.string(),
  salesCentavos: z.number(),
  salesCount: z.number(),
  gallonsDelivered: z.number(),
  newCustomers: z.number(),
  schedulesByStatus: z.array(z.object({ status: z.string(), count: z.number() })),
});

export const reportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ReportSummary = z.infer<typeof reportSchema>;

export function getReport(from: string, to: string) {
  const query = new URLSearchParams({ from, to }).toString();
  return apiRequest(`/reports/summary?${query}`, { schema: reportSchema });
}
