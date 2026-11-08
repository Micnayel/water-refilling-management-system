import { apiRequest } from "@/lib/api-client";
import {
  customerPageSchema,
  maskedCustomerSchema,
  revealedCustomerSchema,
  type CustomerFormValues,
  type MaskedCustomer,
} from "./schemas";

export function queryCustomers(input: {
  cursor?: string;
  pageSize: number;
  search?: string;
  status?: "active" | "archived";
}): Promise<{ items: MaskedCustomer[]; nextCursor: string | null }> {
  return apiRequest("/customers/query", {
    method: "POST",
    body: input,
    schema: customerPageSchema,
  });
}

export function getCustomer(id: string): Promise<MaskedCustomer> {
  return apiRequest(`/customers/${id}`, { schema: maskedCustomerSchema });
}

export function revealCustomer(id: string) {
  return apiRequest(`/customers/${id}/reveal`, {
    method: "POST",
    body: {},
    schema: revealedCustomerSchema,
  });
}

export function createCustomer(values: CustomerFormValues) {
  return apiRequest("/customers", {
    method: "POST",
    body: values,
    schema: maskedCustomerSchema,
  });
}

export function updateCustomer(id: string, values: CustomerFormValues & { version: number }) {
  return apiRequest(`/customers/${id}`, {
    method: "PATCH",
    body: values,
    schema: maskedCustomerSchema,
  });
}

export function setCustomerStatus(id: string, action: "archive" | "restore") {
  return apiRequest(`/customers/${id}/${action}`, {
    method: "POST",
    body: {},
    schema: maskedCustomerSchema,
  });
}
