import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomerFormValues } from "./schemas";
import * as service from "./service";

export const customerKeys = {
  list: ["customers", "list"] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
};

export function useCustomerList(
  page: number,
  pageSize: number,
  search: string,
  status: "active" | "archived" | "",
) {
  const cursor = page <= 1 ? undefined : String((page - 1) * pageSize);
  return useQuery({
    queryKey: [...customerKeys.list, cursor ?? "start", pageSize, search, status],
    queryFn: () =>
      service.queryCustomers({
        cursor,
        pageSize,
        search: search || undefined,
        status: status || undefined,
      }),
    placeholderData: (previous) => previous,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? "none"),
    queryFn: () => service.getCustomer(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["customers"] });
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (values: CustomerFormValues) => service.createCustomer(values),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer(id: string) {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (values: CustomerFormValues & { version: number }) =>
      service.updateCustomer(id, values),
    onSuccess: invalidate,
  });
}

export function useRevealCustomer(id: string) {
  return useMutation({
    mutationFn: () => service.revealCustomer(id),
  });
}

export function useCustomerStatus(id: string) {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (action: "archive" | "restore") => service.setCustomerStatus(id, action),
    onSuccess: invalidate,
  });
}
