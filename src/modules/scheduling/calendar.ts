import { toIsoDate } from "@/lib/dates";

export interface CalendarDay {
  /** ISO date used for grouping and API filters. */
  iso: string;
  /** Day of the month shown in the cell. */
  day: number;
  /** False for the leading and trailing days borrowed from adjacent months. */
  inMonth: boolean;
}

export interface MonthRange {
  from: string;
  to: string;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Sunday-first grid that covers the whole month in five or six weeks. */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const weeks = Math.ceil((first.getDay() + daysInMonth) / 7);

  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      iso: toIsoDate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}

/** Fetch range covering every visible cell, including borrowed days. */
export function monthRange(year: number, month: number): MonthRange {
  const grid = buildMonthGrid(year, month);
  return { from: grid[0]?.iso ?? "", to: grid[grid.length - 1]?.iso ?? "" };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(year, month, 1));
}

export function formatDayLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(`${iso}T12:00:00Z`));
}
