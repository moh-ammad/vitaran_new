import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { EXCEL_MIME_TYPE } from "../utils/excel.js";
import type { RankingReport } from "./analysis.service.js";

const SUBJECT_LABELS: Record<string, string> = {
  MATHEMATICS: "Mathematics",
  PHYSICS: "Physics",
  CHEMISTRY: "Chemistry",
  BIOLOGY: "Biology",
  SCIENCE: "Science",
};

export type RankingFile = {
  fileName: string;
  mime: string;
  data: Uint8Array;
};

function subjectLabel(subject: string) {
  return SUBJECT_LABELS[subject] ?? subject.replaceAll("_", " ");
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMark(value: number | null | undefined) {
  if (value == null) return "";
  return Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.05
    ? Math.round(value)
    : Number(value.toFixed(1));
}

function sharedMax(values: Array<number | null | undefined>) {
  const nums = values.filter((value): value is number => value != null);
  if (nums.length === 0) return null;
  const first = nums[0]!;
  return nums.every((value) => value === first) ? first : null;
}

function withMax(label: string, max: number | null | undefined) {
  const outOf = formatMark(max ?? null);
  return outOf === "" ? label : `${label} (max marks ${outOf})`;
}

function scopeTitle(report: RankingReport) {
  if (report.scope.mode === "overall") return "Overall ranking";
  return report.scope.testLabel ?? "Latest test";
}

function scopeSubtitle(report: RankingReport) {
  return [
    report.scope.schoolName ? titleCase(report.scope.schoolName) : "All schools",
    report.scope.programName ? titleCase(report.scope.programName) : report.scope.program,
    report.scope.classLevel != null ? `Class ${report.scope.classLevel}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function fileSlug(report: RankingReport, ext: "xlsx" | "pdf") {
  const bits = [
    "ranking",
    report.scope.program,
    report.scope.classLevel != null ? `class-${report.scope.classLevel}` : null,
    report.scope.mode,
    report.scope.mode === "test" && report.scope.testId ? `test-${report.scope.testId}` : null,
  ].filter(Boolean);
  return `${bits.join("-").replace(/[^a-zA-Z0-9._-]+/g, "-")}.${ext}`;
}

function headerLabels(report: RankingReport) {
  return [
    "Rank",
    "Student",
    "School",
    "School ID",
    "Roll",
    "Section",
    ...(report.scope.mode === "overall" ? ["Tests"] : []),
    ...report.subjects.map((subject) =>
      withMax(
        subjectLabel(subject),
        sharedMax(report.rows.map((row) => row.subjects.find((item) => item.subject === subject)?.max)),
      ),
    ),
    withMax(
      report.scope.mode === "overall" ? "Avg total" : "Total",
      sharedMax(report.rows.map((row) => row.max)),
    ),
  ];
}

function rowValues(report: RankingReport, row: RankingReport["rows"][number]) {
  return [
    row.rank,
    titleCase(row.name),
    titleCase(row.schoolName),
    row.schoolCode,
    row.rollNo,
    row.sectionName ?? "",
    ...(report.scope.mode === "overall" ? [row.tests] : []),
    ...report.subjects.map((subject) => formatMark(row.subjects.find((item) => item.subject === subject)?.score)),
    formatMark(row.score),
  ];
}

export async function buildRankingFile(report: RankingReport, format: "xlsx" | "pdf"): Promise<RankingFile> {
  if (format === "pdf") {
    return { fileName: fileSlug(report, "pdf"), mime: "application/pdf", data: await rankingPdf(report) };
  }
  return { fileName: fileSlug(report, "xlsx"), mime: EXCEL_MIME_TYPE, data: await rankingExcel(report) };
}

async function rankingExcel(report: RankingReport): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ranking", { views: [{ state: "frozen", ySplit: 4 }] });
  sheet.addRow([scopeTitle(report)]);
  sheet.addRow([scopeSubtitle(report)]);
  sheet.addRow([]);
  const headers = headerLabels(report);
  sheet.addRow(headers);

  sheet.getRow(1).font = { bold: true, size: 14 };
  sheet.getRow(2).font = { size: 11, color: { argb: "FF525252" } };
  sheet.getRow(4).font = { bold: true };
  sheet.getRow(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } };

  for (const row of report.rows) {
    sheet.addRow(rowValues(report, row));
  }

  headers.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    const numeric = header !== "Student" && header !== "School" && header !== "School ID" && header !== "Section" && header !== "Roll";
    column.width = header === "Student" || header === "School" ? 28 : Math.max(header.length + 2, 10);
    if (numeric) column.alignment = { horizontal: "right" };
  });

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return new Uint8Array(buffer);
}

function pdfSafe(value: string) {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim();
}

async function rankingPdf(report: RankingReport): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [842, 595];
  const margin = 36;
  const inner = pageSize[0] - margin * 2;
  const headers = headerLabels(report).map((label) => (label === "School ID" ? "ID" : label));
  const widths = columnWidths(headers, inner);
  const rowHeight = 16;
  const headerHeight = 18;
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - margin;

  const drawHeader = () => {
    page.drawText(pdfSafe(scopeTitle(report)), { x: margin, y: y - 4, size: 14, font: bold, color: rgb(0.07, 0.09, 0.15) });
    y -= 18;
    const subtitle = pdfSafe(scopeSubtitle(report));
    if (subtitle) {
      page.drawText(subtitle, { x: margin, y, size: 9, font, color: rgb(0.35, 0.35, 0.38) });
      y -= 16;
    }
    y -= 6;
    drawTableRow(page, headers, widths, margin, y, headerHeight, bold, 8, true);
    y -= headerHeight;
  };

  drawHeader();

  if (report.rows.length === 0) {
    page.drawText("No published scores for this selection.", {
      x: margin,
      y: y - 12,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.42),
    });
  }

  for (const row of report.rows) {
    if (y - rowHeight < margin) {
      page = pdf.addPage(pageSize);
      y = pageSize[1] - margin;
      drawHeader();
    }
    drawTableRow(
      page,
      rowValues(report, row).map((value) => (value == null || value === "" ? "—" : String(value))),
      widths,
      margin,
      y,
      rowHeight,
      font,
      8,
      false,
    );
    y -= rowHeight;
  }

  const bytes = await pdf.save();
  return bytes;
}

function columnWidths(headers: string[], inner: number) {
  const weights = headers.map((header) => {
    if (header === "Student" || header === "School") return 2.4;
    if (header === "Rank" || header === "Tests" || header === "ID") return 0.7;
    if (header === "Roll" || header === "Section") return 0.9;
    return 1;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (weight / total) * inner);
}

function drawTableRow(
  page: PDFPage,
  values: string[],
  widths: number[],
  startX: number,
  y: number,
  height: number,
  font: PDFFont,
  size: number,
  header: boolean,
) {
  let x = startX;
  if (header) {
    page.drawRectangle({
      x: startX,
      y: y - height + 4,
      width: widths.reduce((sum, width) => sum + width, 0),
      height,
      color: rgb(0.96, 0.96, 0.97),
    });
  }
  values.forEach((value, index) => {
    const width = widths[index] ?? 40;
    const numeric = header ? index === 0 : /^-?\d+(\.\d+)?%?$/.test(value) || value === "—";
    const text = truncate(pdfSafe(value), font, size, width - 8);
    const textWidth = font.widthOfTextAtSize(text, size);
    const tx = numeric ? x + width - 4 - textWidth : x + 4;
    page.drawText(text, {
      x: Math.max(x + 2, tx),
      y: y - 8,
      size,
      font,
      color: rgb(0.09, 0.09, 0.11),
    });
    x += width;
  });
}

function truncate(value: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let text = value;
  while (text.length > 1 && font.widthOfTextAtSize(`${text}...`, size) > maxWidth) {
    text = text.slice(0, -1);
  }
  return `${text}...`;
}
