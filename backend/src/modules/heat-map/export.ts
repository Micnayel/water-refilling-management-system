export interface ExportCell {
  area: string;
  count: number;
  latitude: number;
  longitude: number;
}

export interface ExportMeta {
  from: string;
  to: string;
  metric: string;
  area?: string;
  minCellSize: number;
  suppressedCells: number;
}

export type ExportFormat = "csv" | "xlsx" | "pdf";

const HEADER = ["Area", "Count", "Latitude", "Longitude"];

function csvValue(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(cells: ExportCell[], meta: ExportMeta): string {
  const lines = [
    `# Heat map ${meta.metric} from ${meta.from} to ${meta.to}${meta.area ? `, area ${meta.area}` : ""}`,
    `# Minimum cell size ${meta.minCellSize}; ${meta.suppressedCells} small cell(s) suppressed.`,
    HEADER.join(","),
    ...cells.map((cell) => [cell.area, cell.count, cell.latitude, cell.longitude].map(csvValue).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sheetCell(reference: string, value: string | number): string {
  if (typeof value === "number") {
    return `<c r="${reference}"><v>${value}</v></c>`;
  }
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

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Minimal ZIP writer (stored, no compression) so the workbook needs no library. */
function zipStored(entries: Array<{ name: string; data: Buffer }>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, entry.data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + entry.data.length;
  }

  const centralSize = centrals.reduce((total, buffer) => total + buffer.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, ...centrals, end]);
}

export function toXlsx(cells: ExportCell[]): Buffer {
  const rows: Array<Array<string | number>> = [HEADER, ...cells.map((cell) => [cell.area, cell.count, cell.latitude, cell.longitude])];
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
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(rootRels, "utf8") },
    { name: "xl/workbook.xml", data: Buffer.from(workbook, "utf8") },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(workbookRels, "utf8") },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(worksheet, "utf8") },
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

function column(value: string, width: number): string {
  return value.length > width ? `${value.slice(0, width - 2)}..` : value;
}

export function toPdf(cells: ExportCell[], meta: ExportMeta): Buffer {
  const rowsPerPage = 34;
  const pageCount = Math.max(1, Math.ceil(cells.length / rowsPerPage));
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];
  let nextObject = 5;

  const header = pdfLine(48, 750, 16, "Heat Map Export", true);
  const subtitle = [
    pdfLine(48, 730, 9, `Metric: ${meta.metric}    Range: ${meta.from} to ${meta.to}`),
    pdfLine(48, 716, 9, `${meta.area ? `Area: ${meta.area}    ` : ""}Minimum cell size: ${meta.minCellSize}    Suppressed: ${meta.suppressedCells}`),
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
      content.push(pdfLine(48, y, 9, column(cell.area, 42)));
      content.push(pdfLine(320, y, 9, String(cell.count)));
      content.push(pdfLine(390, y, 9, cell.latitude.toFixed(3)));
      content.push(pdfLine(470, y, 9, cell.longitude.toFixed(3)));
      y -= 16;
    }
    content.push(pdfLine(48, 60, 8, `Page ${page + 1} of ${pageCount}`));

    const pageNumber = nextObject;
    const contentNumber = nextObject + 1;
    nextObject += 2;
    pageObjectNumbers.push(pageNumber);
    objects[pageNumber - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>`;
    const stream = content.join("\n");
    objects[contentNumber - 1] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
  }

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageCount} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${objects[index] ?? "<< >>"}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}
