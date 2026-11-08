import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDownIcon, SearchIcon } from "./icons";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches found.",
  disabled,
  id,
  ...aria
}: SearchableSelectProps) {
  const generatedId = useId();
  const listId = `${id ?? generatedId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.sublabel?.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={cn("compact-input flex items-center justify-between gap-2 text-left", disabled && "opacity-60")}
        {...aria}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon className="text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-lg">
          <div className="relative mb-1">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              className="compact-input pl-7"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={searchPlaceholder}
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-center text-xs text-muted-foreground">{emptyMessage}</li>
            ) : (
              filtered.map((option) => (
                <li key={option.value} role="option" aria-selected={option.value === value}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col rounded px-2 py-1.5 text-left hover:bg-muted",
                      option.value === value && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => {
                      onChange(option.value);
                      close();
                    }}
                  >
                    <span className="text-sm">{option.label}</span>
                    {option.sublabel ? (
                      <span className="text-xs text-muted-foreground">{option.sublabel}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
