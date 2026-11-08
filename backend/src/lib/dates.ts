const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function manilaParts(date: Date) {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function fromManila(year: number, month: number, day: number, hour = 0): Date {
  return new Date(Date.UTC(year, month, day, hour) - MANILA_OFFSET_MS);
}

export function manilaDayRange(now = new Date()): { start: Date; end: Date } {
  const { year, month, day } = manilaParts(now);
  return { start: fromManila(year, month, day), end: fromManila(year, month, day + 1) };
}

export function manilaMonthRange(now = new Date()): { start: Date; end: Date } {
  const { year, month } = manilaParts(now);
  return { start: fromManila(year, month, 1), end: fromManila(year, month + 1, 1) };
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return fromManila(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function formatManilaDate(date: Date): string {
  const { year, month, day } = manilaParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
