import { apiRequest } from "@/lib/api-client";
import { dashboardMapSchema, dashboardSummarySchema, revealResultSchema } from "./schemas";

export function getSummary() {
  return apiRequest("/dashboard/summary", { schema: dashboardSummarySchema });
}

export function getMap() {
  return apiRequest("/dashboard/map", { schema: dashboardMapSchema });
}

export function revealCustomer(input: { customerId: string; field: "name" | "location" }) {
  return apiRequest("/dashboard/reveal", {
    method: "POST",
    body: input,
    schema: revealResultSchema,
  });
}
