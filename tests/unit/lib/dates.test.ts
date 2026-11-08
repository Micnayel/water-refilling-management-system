import { describe, expect, it } from "vitest";
import { daysAgoIso, formatDateNumeric, formatDateTime, formatTime, toIsoDate, todayIso } from "@/lib/dates";

describe("date helpers", () => {
  it("formats ISO dates as MM/DD/YYYY in Asia/Manila", () => {
    expect(formatDateNumeric("2026-01-05")).toBe("01/05/2026");
    expect(formatDateNumeric(null)).toBe("—");
    expect(formatDateNumeric("not-a-date")).toBe("—");
  });

  it("formats ISO timestamps with time", () => {
    const text = formatDateTime("2026-01-05T03:04:00.000Z");
    expect(text).toContain("01/05/2026");
    expect(text).toContain("11:04");
  });

  it("converts local dates to ISO without timezone drift", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("returns today and earlier dates in ISO form", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(daysAgoIso(0)).toBe(todayIso());
    expect(daysAgoIso(30) < todayIso()).toBe(true);
  });

  it("formats times as 12-hour clock values", () => {
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("09:30")).toBe("9:30 AM");
    expect(formatTime("13:45")).toBe("1:45 PM");
    expect(formatTime("12:00")).toBe("12:00 PM");
    expect(formatTime("bad")).toBe("bad");
  });
});
