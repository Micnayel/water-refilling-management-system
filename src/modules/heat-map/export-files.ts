import type { HeatResult } from "./schemas";

export type HeatExportFormat = "csv" | "xlsx" | "pdf";

export interface HeatExportMeta {
  from: string;
  to: string;
  metric: string;
  area?: string;
  minCellSize: number;
  suppressedCells: number;
}

export interface HeatExportFile {
  blob: Blob;
  filename: string;
}

type Cell = HeatResult["cells"][number];

const HEADER = ["Area", "Count", "Latitude", "Longitude"];

function csvValue(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function buildCsv(cells: Cell[], meta: HeatExportMeta): string {
  return [
    `# Heat map ${meta.metric} from ${meta.from} to ${meta.to}${meta.area ? `, area ${meta.area}` : ""}`,
    `# Minimum cell size ${meta.minCellSize}; ${meta.suppressedCells} small cell(s) suppressed.`,
    HEADER.join(","),
    ...cells.map((cell) => [cell.area, cell.count, cell.latitude, cell.longitude].map(csvValue).join(",")),
  ].join("\n") + "\n";
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sheetCell(reference: string, value: string | number): string {
  if (typeof value === "number") return `<c r="${reference}"><v>${value}</v></c>`;
  return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Minimal ZIP writer (stored entries) so XLSX needs no extra dependency. */
function zipStored(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true);
    local.set(name, 30);
    parts.push(local, entry.data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);

    offset += local.length + entry.data.length;
  }

  const centralSize = centrals.reduce((total, buffer) => total + buffer.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  const all = [...parts, ...centrals, end];
  const total = all.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let position = 0;
  for (const part of all) {
    output.set(part, position);
    position += part.length;
  }
  return output;
}

function buildXlsx(cells: Cell[]): Uint8Array {
  const encoder = new TextEncoder();
  const rows: Array<Array<string | number>> = [
    HEADER,
    ...cells.map((cell) => [cell.area, cell.count, cell.latitude, cell.longitude]),
  ];
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cellsXml = row
        .map((value, columnIndex) => sheetCell(`${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`, value))
        .join("");
      return `<row r="${rowIndex + 1}">${cellsXml}</row>`;
    })
    .join("");

  const worksheet =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${sheetRows}</sheetData></worksheet>`;
  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets><sheet name="Heat map" sheetId="1" r:id="rId1"/></sheets></workbook>';
  const workbookRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    "</Relationships>";
  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>";
  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    "</Types>";

  return zipStored([
    { name: "[Content_Types].xml", data: encoder.encode(contentTypes) },
    { name: "_rels/.rels", data: encoder.encode(rootRels) },
    { name: "xl/workbook.xml", data: encoder.encode(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: encoder.encode(workbookRels) },
    { name: "xl/worksheets/sheet1.xml", data: encoder.encode(worksheet) },
  ]);
}

function pdfText(value: string): string {
  return value
    .replace(/[^\x20-\xff]/g, "?")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function pdfLine(x: number, y: number, size: number, text: string, bold = false): string {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfText(text)}) Tj ET`;
}

function buildPdf(cells: Cell[], meta: HeatExportMeta): Uint8Array {
  const rowsPerPage = 34;
  const pageCount = Math.max(1, Math.ceil(cells.length / rowsPerPage));
  const objects: string[] = [];
  const pageNumbers: number[] = [];
  let nextObject = 5;

  const header = pdfLine(48, 750, 16, "Heat Map Export", true);
  const subtitle = [
    pdfLine(48, 730, 9, `Metric: ${meta.metric}    Range: ${meta.from} to ${meta.to}`),
    pdfLine(
      48,
      716,
      9,
      `${meta.area ? `Area: ${meta.area}    ` : ""}Minimum cell size: ${meta.minCellSize}    Suppressed: ${meta.suppressedCells}`,
    ),
  ].join("\n");

  for (let page = 0; page < pageCount; page += 1) {
    const pageRows = cells.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    const content: string[] = [header, subtitle];
    let y = 690;
    content.push(pdfLine(48, y, 9, "Area", true));
    content.push(pdfLine(320, y, 9, "Count", true));
    content.push(pdfLine(390, y, 9, "Latitude", true));
    content.push(pdfLine(470, y, 9, "Longitude", true));
    y -= 16;
    for (const cell of pageRows) {
      content.push(pdfLine(48, y, 9, cell.area.length > 42 ? `${cell.area.slice(0, 40)}..` : cell.area));
      content.push(pdfLine(320, y, 9, String(cell.count)));
      content.push(pdfLine(390, y, 9, cell.latitude.toFixed(3)));
      content.push(pdfLine(470, y, 9, cell.longitude.toFixed(3)));
      y -= 16;
    }
    content.push(pdfLine(48, 60, 8, `Page ${page + 1} of ${pageCount}`));

    const pageNumber = nextObject;
    const contentNumber = nextObject + 1;
    nextObject += 2;
    pageNumbers.push(pageNumber);
    objects[pageNumber - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>`;
    const stream = content.join("\n");
    objects[contentNumber - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  }

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageCount} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index] ?? "<< >>"}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) bytes[index] = pdf.charCodeAt(index) & 0xff;
  return bytes;
}

function blobPart(bytes: Uint8Array): BlobPart {
  const copy = new ArrayBuffer(bytes.length);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export function buildHeatExport(
  format: HeatExportFormat,
  cells: Cell[],
  meta: HeatExportMeta,
): HeatExportFile {
  const base = `heat-map-${meta.from}-to-${meta.to}`;
  if (format === "xlsx") {
    return {
      blob: new Blob([blobPart(buildXlsx(cells))], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: `${base}.xlsx`,
    };
  }
  if (format === "pdf") {
    return {
      blob: new Blob([blobPart(buildPdf(cells, meta))], { type: "application/pdf" }),
      filename: `${base}.pdf`,
    };
  }
  return {
    blob: new Blob([buildCsv(cells, meta)], { type: "text/csv;charset=utf-8" }),
    filename: `${base}.csv`,
  };
}
