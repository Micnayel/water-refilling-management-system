import { Button } from "./button";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { NativeSelect } from "./card";

export interface PaginationProps {
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  itemCount: number;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  page,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  itemCount,
  hasNext,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = itemCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = itemCount === 0 ? 0 : from + itemCount - 1;
  const lastPage = hasNext ? page + 1 : page;
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1).slice(-5);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-2 border-t border-border p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite">
        Showing {from}–{to}
        {hasNext ? "+" : ""} · page {page}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5">
          <span>Per page</span>
          <NativeSelect
            aria-label="Rows per page"
            className="h-8 w-16"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          {pageNumbers.map((number) => (
            <Button
              key={number}
              variant={number === page ? "default" : "outline"}
              size="icon"
              aria-label={`Page ${number}`}
              aria-current={number === page ? "page" : undefined}
              onClick={() => onPageChange(number)}
            >
              {number}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </nav>
  );
}
