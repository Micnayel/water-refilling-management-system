import { describe, expect, it } from "vitest";
import { querySchedulesSchema } from "../src/modules/scheduling/schemas";

describe("querySchedulesSchema", () => {
  it("accepts a calendar date range", () => {
    const parsed = querySchedulesSchema.parse({
      from: "2026-11-01",
      to: "2026-12-05",
      pageSize: 100,
    });
    expect(parsed).toMatchObject({ from: "2026-11-01", to: "2026-12-05", pageSize: 100 });
  });

  it("accepts a single date or status filter", () => {
    expect(querySchedulesSchema.parse({ date: "2026-11-10" }).date).toBe("2026-11-10");
    expect(querySchedulesSchema.parse({ status: "Scheduled" }).status).toBe("Scheduled");
  });

  it("rejects an inverted range", () => {
    expect(() =>
      querySchedulesSchema.parse({ from: "2026-12-05", to: "2026-11-01" }),
    ).toThrow();
  });

  it("rejects malformed dates", () => {
    expect(() => querySchedulesSchema.parse({ from: "11/01/2026" })).toThrow();
  });
});
