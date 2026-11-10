import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  formatDayLabel,
  formatMonthLabel,
  monthRange,
  shiftMonth,
  WEEKDAY_LABELS,
} from "@/modules/scheduling/calendar";

describe("scheduling calendar", () => {
  it("builds a Sunday-first grid with only the needed weeks", () => {
    const grid = buildMonthGrid(2026, 10);
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(grid).toHaveLength(35);
    expect(grid[0]?.iso).toBe("2026-11-01");
    expect(grid[grid.length - 1]?.iso).toBe("2026-12-05");
    expect(grid.filter((day) => day.inMonth)).toHaveLength(30);
  });

  it("borrows adjacent-month days to fill the grid", () => {
    const grid = buildMonthGrid(2026, 8);
    expect(grid[0]?.iso).toBe("2026-08-30");
    expect(grid[0]?.inMonth).toBe(false);
    expect(grid[0]?.day).toBe(30);
  });

  it("returns a fetch range covering every visible cell", () => {
    expect(monthRange(2026, 10)).toEqual({ from: "2026-11-01", to: "2026-12-05" });
  });

  it("moves across year boundaries", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it("formats month and day labels for the modal", () => {
    expect(formatMonthLabel(2026, 10)).toBe("November 2026");
    expect(formatDayLabel("2026-11-10")).toContain("November 10, 2026");
  });
});
