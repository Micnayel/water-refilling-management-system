import { describe, expect, it } from "vitest";
import { previewResponse } from "@/lib/preview-data";

interface HeatResult {
  cells: Array<{ area: string; latitude: number; longitude: number; count: number }>;
}

function points(body: Record<string, unknown>): HeatResult {
  return previewResponse("/heat-map/points", "POST", {
    metric: "customer-density",
    from: "2020-01-01",
    to: "2100-01-01",
    ...body,
  }) as HeatResult;
}

const total = (result: HeatResult) => result.cells.reduce((sum, cell) => sum + cell.count, 0);

describe("preview heat map data", () => {
  it("returns aggregated cells without names or addresses", () => {
    const result = points({});
    expect(result.cells.length).toBeGreaterThan(0);
    for (const cell of result.cells) {
      expect(Object.keys(cell).sort()).toEqual(["area", "count", "latitude", "longitude"]);
      expect(cell.count).toBeGreaterThan(0);
    }
  });

  it("narrows customer density to the selected registration range", () => {
    const wide = total(points({}));
    const narrow = total(
      points({
        from: new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10),
      }),
    );
    expect(narrow).toBeLessThan(wide);
  });

  it("filters a selected area", () => {
    const result = points({ area: "Cubao" });
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0]?.area).toBe("Cubao");
  });

  it("counts completed deliveries in the selected range", () => {
    const result = points({
      metric: "completed-deliveries",
      from: new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    });
    expect(total(result)).toBeGreaterThan(0);
  });
});
