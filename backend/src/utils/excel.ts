import ExcelJS from "exceljs";

export const EXCEL_MAX_BYTES = 2 * 1024 * 1024;
export const EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAX_COLUMNS = 100;
const MAX_ROWS = 5000;
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export type CellValue = string | number | boolean | null;

export type ParsedSheet = {
  /** Title lines above the header, e.g. school name, test date, max marks. */
  caption: string[];
  columns: string[];
  rows: CellValue[][];
};

/** Thrown for files that can't be read as a results sheet; the message is shown to the admin. */
export class ExcelParseError extends Error {}

function toIsoDate(date: Date): string {
  const iso = date.toISOString();
  return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso;
}

/** Flattens formulas, rich text, hyperlinks and dates into plain JSON values. */
function normalizeCell(value: unknown): CellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim() === "" ? null : value.replace(/[^\S\n]+/g, " ").trim();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (value instanceof Date) return toIsoDate(value);

  if (typeof value === "object") {
    if ("error" in value) return null;
    if ("result" in value) return normalizeCell(value.result);
    if ("formula" in value || "sharedFormula" in value) return null;
    if ("richText" in value && Array.isArray(value.richText)) {
      return normalizeCell(value.richText.map((part: { text?: string }) => part.text ?? "").join(""));
    }
    if ("text" in value) return normalizeCell(value.text);
  }
  return null;
}

const isEmptyRow = (values: CellValue[]) => values.every((value) => value === null);

const collapseSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const filledValues = (values: CellValue[]) => values.filter((value) => value !== null);

/** Merged title cells repeat one value across the row; a header has a distinct label per column. */
function findHeaderIndex(lines: CellValue[][]) {
  const widest = Math.max(...lines.map((values) => filledValues(values).length));
  const minLabels = Math.max(2, Math.ceil(widest * 0.6));
  const index = lines.findIndex((values) => {
    const filled = filledValues(values);
    return filled.every((value) => typeof value === "string") && new Set(filled).size >= minLabels;
  });
  return Math.max(index, 0);
}

/**
 * Reads the first non-empty worksheet. Title rows above the header become the caption,
 * the header row gives the columns, and every row below it is a student.
 */
export async function parseResultSheet(file: Buffer): Promise<ParsedSheet> {
  if (!file.subarray(0, ZIP_SIGNATURE.length).equals(ZIP_SIGNATURE)) {
    throw new ExcelParseError("Only Excel (.xlsx) files can be uploaded");
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(file as unknown as ArrayBuffer);
  } catch {
    throw new ExcelParseError("This file couldn't be read as an Excel (.xlsx) file");
  }

  const worksheet = workbook.worksheets.find((sheet) => sheet.actualRowCount > 0);
  if (!worksheet) throw new ExcelParseError("This file has no data");

  const lines: CellValue[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    // ExcelJS row values are 1-based.
    const values = (row.values as unknown[]).slice(1).map(normalizeCell);
    if (!isEmptyRow(values)) lines.push(values);
  });

  if (lines.length === 0) throw new ExcelParseError("This file has no data");

  const headerIndex = findHeaderIndex(lines);
  const header = lines[headerIndex] ?? [];
  const body = lines.slice(headerIndex + 1);
  const caption = lines
    .slice(0, headerIndex)
    .map((values) => [...new Set(filledValues(values).map((value) => collapseSpaces(String(value))))].join(" · "));

  const width = header.reduce<number>((last, value, index) => (value === null ? last : index + 1), 0);
  if (width > MAX_COLUMNS) throw new ExcelParseError(`Keep the sheet under ${MAX_COLUMNS} columns`);
  if (body.length > MAX_ROWS) throw new ExcelParseError(`Keep the sheet under ${MAX_ROWS} rows`);

  const columns = header
    .slice(0, width)
    .map((value, index) => (value === null ? `Column ${index + 1}` : collapseSpaces(String(value))));
  const rows = body
    .map((values) => Array.from({ length: width }, (_, index) => values[index] ?? null))
    .filter((values) => !isEmptyRow(values));
  if (rows.length === 0) throw new ExcelParseError("Add at least one student row below the header");

  return { caption, columns, rows };
}
