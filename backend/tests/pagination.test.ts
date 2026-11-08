import { describe, expect, it } from "vitest";
import { buildPage, decodeCursor, encodeCursor } from "../src/lib/pagination";

describe("pagination", () => {
  it("encodes and decodes offsets", () => {
    expect(decodeCursor(undefined)).toBe(0);
    expect(decodeCursor("20")).toBe(20);
    expect(decodeCursor("-5")).toBe(0);
    expect(decodeCursor("not-a-number")).toBe(0);
    expect(encodeCursor(40)).toBe("40");
  });

  it("returns a next cursor when more rows exist", () => {
    const page = buildPage([1, 2, 3], 0, 2);
    expect(page.items).toEqual([1, 2]);
    expect(page.nextCursor).toBe("2");
  });

  it("omits the next cursor on the last page", () => {
    const page = buildPage([1, 2], 20, 2);
    expect(page.items).toEqual([1, 2]);
    expect(page.nextCursor).toBeNull();
  });

  it("handles empty pages", () => {
    expect(buildPage([], 0, 20)).toEqual({ items: [], nextCursor: null });
  });
});
