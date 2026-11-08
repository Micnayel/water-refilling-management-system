import { useQuery } from "@tanstack/react-query";
import * as service from "./service";

export function useReport(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ["reports", from, to],
    queryFn: () => service.getReport(from, to),
    enabled: enabled && from <= to,
  });
}
