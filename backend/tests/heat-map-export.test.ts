import { describe, expect, it } from "vitest";
import { toCsv, toPdf, toXlsx, type ExportMeta } from "../src/modules/heat-map/export";

const meta: ExportMeta = {
  from: "2026-11-01",
  to: "2026-11-10",
  metric: "customer-density",
  minCellSize: 3,
  suppressedCells: 2,
};

const cells = [
  { area: "Batasan Hills", count: 12, latitude: 14.6856, longitude: 121.0951 },
  { area: "Creekside, \"North\"", count: 5, latitude: 14.7, longitude: 121.08 },
];

describe("heat map export files", () => {
  it("builds a CSV with escaped values and a summary header", () => {
    const csv = toCsv(cells, meta);
    expect(csv).toContain("Area,Count,Latitude,Longitude");
    expect(csv).toContain('"Creekside, ""North"""');
    expect(csv).toContain("2026-11-01 to 2026-11-10");
  });

  it("builds an XLSX package that starts with the ZIP signature", () => {
    const xlsx = toXlsx(cells);
    expect(xlsx.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(xlsx.toString("latin1")).toContain("xl/worksheets/sheet1.xml");
    expect(xlsx.toString("utf8")).toContain("Batasan Hills");
  });

  it("builds a PDF with a valid trailer and escaped text", () => {
    const pdf = toPdf(cells, meta);
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("Batasan Hills");
    expect(text).toContain('Creekside, "North"');
    expect(text).toContain("/Subtype /Type1");
  });

  it("paginates long exports", () => {
    const many = Array.from({ length: 80 }, (_, index) => ({
      area: `Area ${index + 1}`,
      count: index + 1,
      latitude: 14.6,
      longitude: 121,
    }));
    const text = toPdf(many, meta).toString("latin1");
    expect(text).toContain("/Count 3");
    expect(text).toContain("Page 3 of 3");
  });
});
