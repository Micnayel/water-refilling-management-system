export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const value = Number.parseInt(cursor, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function encodeCursor(offset: number): string {
  return String(offset);
}

export function buildPage<T>(items: T[], offset: number, pageSize: number): Page<T> {
  const hasMore = items.length > pageSize;
  const pageItems = hasMore ? items.slice(0, pageSize) : items;
  return {
    items: pageItems,
    nextCursor: hasMore ? encodeCursor(offset + pageSize) : null,
  };
}
