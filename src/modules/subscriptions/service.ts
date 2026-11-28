import { apiRequest } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { subscriptionPageSchema, subscriptionSchema, type SubscriptionFormValues } from "./schemas";
import { z } from "zod";

export function querySubscriptions(input: {
  cursor?: string;
  pageSize?: number;
  status?: string;
  search?: string;
}) {
  return apiRequest("/subscriptions/query", { method: "POST", body: input, schema: subscriptionPageSchema });
}

export function getSubscription(id: string) {
  return apiRequest(`/subscriptions/${id}`, { schema: subscriptionSchema });
}

export function createSubscription(values: SubscriptionFormValues) {
  return apiRequest("/subscriptions", {
    method: "POST",
    body: normalize(values),
    schema: subscriptionSchema,
  });
}

export function updateSubscription(id: string, values: Partial<SubscriptionFormValues> & { version: number }) {
  return apiRequest(`/subscriptions/${id}`, {
    method: "PATCH",
    body: { ...normalize(values), version: values.version },
    schema: subscriptionSchema,
  });
}

export function setSubscriptionStatus(id: string, input: { status: string; version: number }) {
  return apiRequest(`/subscriptions/${id}/status`, {
    method: "POST",
    body: input,
    schema: subscriptionSchema,
  });
}

export function listAssignees() {
  return apiRequest("/schedules/assignees", {
    schema: z.object({ items: z.array(z.object({ id: z.string(), fullName: z.string() })) }),
  });
}

export function exportSubscriptions() {
  return downloadFile("/subscriptions/export");
}

function normalize(values: Partial<SubscriptionFormValues>) {
  return {
    customerId: values.customerId,
    planName: values.planName,
    status: values.status,
    gallonsPerDelivery: values.gallonsPerDelivery,
    frequency: values.frequency,
    priceCentavos: values.priceCentavos,
    startDate: values.startDate,
    nextBillingDate: values.nextBillingDate ? values.nextBillingDate : null,
    assignedUserId: values.assignedUserId ? values.assignedUserId : null,
    notes: values.notes,
  };
}
