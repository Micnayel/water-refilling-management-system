import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./service";
import type { SubscriptionFormValues } from "./schemas";

export const subscriptionKeys = {
  list: ["subscriptions", "list"] as const,
  detail: (id: string) => ["subscriptions", "detail", id] as const,
};

export function useSubscriptionList(page: number, pageSize: number, status: string, search: string) {
  const cursor = page <= 1 ? undefined : String((page - 1) * pageSize);
  return useQuery({
    queryKey: [...subscriptionKeys.list, cursor ?? "start", pageSize, status, search],
    queryFn: () =>
      service.querySubscriptions({
        cursor,
        pageSize,
        status: status || undefined,
        search: search || undefined,
      }),
    placeholderData: (previous) => previous,
  });
}

export function useCustomerSubscriptions(customerId: string | undefined) {
  return useQuery({
    queryKey: [...subscriptionKeys.list, "customer", customerId ?? "none"],
    queryFn: () => service.querySubscriptions({ customerId: customerId as string, pageSize: 100 }),
    enabled: Boolean(customerId),
  });
}

export function useSubscription(id: string | undefined) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id ?? "none"),
    queryFn: () => service.getSubscription(id as string),
    enabled: Boolean(id),
  });
}

export function useAssignees() {
  return useQuery({ queryKey: ["schedules", "assignees"], queryFn: service.listAssignees });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateSubscription() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (values: SubscriptionFormValues) => service.createSubscription(values),
    onSuccess: invalidate,
  });
}

export function useUpdateSubscription(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (values: Partial<SubscriptionFormValues> & { version: number }) => service.updateSubscription(id, values),
    onSuccess: invalidate,
  });
}

export function useSetSubscriptionStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { id: string; status: string; version: number }) =>
      service.setSubscriptionStatus(input.id, { status: input.status, version: input.version }),
    onSuccess: invalidate,
  });
}

export function useExportSubscriptions() {
  return useMutation({ mutationFn: service.exportSubscriptions });
}
