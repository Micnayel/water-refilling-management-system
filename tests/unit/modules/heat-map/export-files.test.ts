import { describe, expect, it } from "vitest";
import { buildHeatExport, type HeatExportMeta } from "@/modules/heat-map/export-files";

const meta: HeatExportMeta = {
  from: "2026-11-01",
  to: "2026-11-10",
  metric: "customer-density",
  minCellSize: 1,
  suppressedCells: 0,
};

const cells = [{ area: "Batasan Hills", count: 12, latitude: 14.6856, longitude: 121.0951 }];

function readBlob(blob: Blob, as: "text" | "buffer"): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string | ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the blob."));
    if (as === "text") reader.readAsText(blob);
    else reader.readAsArrayBuffer(blob);
  });
}

describe("preview heat map exports", () => {
  it("builds a CSV blob with the area rows", async () => {
    const file = buildHeatExport("csv", cells, meta);
    expect(file.filename).toBe("heat-map-2026-11-01-to-2026-11-10.csv");
    expect(await readBlob(file.blob, "text")).toContain("Batasan Hills,12");
  });

  it("builds an XLSX blob with the ZIP signature", async () => {
    const file = buildHeatExport("xlsx", cells, meta);
    expect(file.filename.endsWith(".xlsx")).toBe(true);
    const bytes = new Uint8Array((await readBlob(file.blob, "buffer")) as ArrayBuffer);
    expect(String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0)).toBe("PK");
  });

  it("builds a PDF blob with a valid trailer", async () => {
    const file = buildHeatExport("pdf", cells, meta);
    expect(file.filename.endsWith(".pdf")).toBe(true);
    const text = (await readBlob(file.blob, "text")) as string;
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("Batasan Hills");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });
});
