import { usePagedList } from "@/hooks/use-paged-list";
import { queryAudit } from "./service";

export function useAuditList(page: number, pageSize: number, event: string) {
  return usePagedList({
    queryKey: ["audit", event],
    page,
    pageSize,
    fetcher: ({ cursor, pageSize: size }) => queryAudit({ cursor, pageSize: size, event }),
  });
}
