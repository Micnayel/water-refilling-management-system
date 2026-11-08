import { useQuery } from "@tanstack/react-query";

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PagedListOptions<T> {
  queryKey: readonly unknown[];
  page: number;
  pageSize: number;
  fetcher: (input: { cursor?: string; pageSize: number }) => Promise<CursorPage<T>>;
  enabled?: boolean;
}

export function usePagedList<T>({
  queryKey,
  page,
  pageSize,
  fetcher,
  enabled = true,
}: PagedListOptions<T>) {
  const cursor = page <= 1 ? undefined : String((page - 1) * pageSize);
  const query = useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: () => fetcher({ cursor, pageSize }),
    enabled,
    placeholderData: (previous) => previous,
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    hasNext: Boolean(query.data?.nextCursor),
  };
}
