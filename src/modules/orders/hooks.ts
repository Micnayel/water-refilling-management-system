import { useQuery } from "@tanstack/react-query";
import * as service from "./service";

export function useOrderList(page: number, pageSize: number, status: string, from: string, to: string) {
  const cursor = page <= 1 ? undefined : String((page - 1) * pageSize);
  return useQuery({
    queryKey: ["orders", cursor ?? "start", pageSize, status, from, to],
    queryFn: () =>
      service.queryOrders({
        cursor,
        pageSize,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    placeholderData: (previous) => previous,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", "detail", id ?? "none"],
    queryFn: () => service.getOrder(id as string),
    enabled: Boolean(id),
  });
}
