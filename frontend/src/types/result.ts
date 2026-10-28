import type { Publishable, SchoolRef } from "@/types/document";
import type { Program, SchoolType, Subject } from "@/types/school";

export type ResultClass = {
  classLevel: number;
  /** Teacher portal: "Class 8-B" when the sheet is scoped to one section. */
  label?: string;
  rowCount: number;
  fileName: string;
  fileSize: number;
  updatedAt: string;
};

/** One test's results for one school and program. */
export type ResultSet = Publishable & {
  id: string;
  /** Uploaded Excel sheet, or a published OMR scan with no matching upload. */
  source?: "upload" | "omr";
  school: SchoolRef & { type: SchoolType };
  /** Regular schools. */
  program: Program | null;
  /** Customized schools. */
  programName: string | null;
  /** Freeform test ID. */
  testId: string;
  /** Ordinal test number. */
  testNumber: number;
  classes: ResultClass[];
  createdAt: string;
  updatedAt: string;
};

export type ResultCell = string | number | boolean | null;

/** A class's parsed spreadsheet. */
export type ResultSheet = Omit<ResultClass, "updatedAt"> & {
  /** Title lines above the sheet's header row. */
  caption: string[];
  columns: string[];
  rows: ResultCell[][];
  classLabel?: string;
  updatedAt: string;
};

/** One published test for the signed-in student — their scores only. */
export type StudentResultRow = {
  resultSetId: string;
  testId: string;
  testNumber: number;
  programName: string;
  classLevel: number;
  sectionName: string | null;
  caption: string[];
  subjects: Array<{ subject: Subject; score: number; max: number | null }>;
  total: number | null;
  maxTotal: number | null;
  percentage: number | null;
  updatedAt: string;
};

export type ResultSchoolProgramOption = {
  code: Program;
  name: string;
  /** Class levels enrolled for this program at the school. */
  classLevels: number[];
};

export type ResultSchoolOption = SchoolRef & {
  type: SchoolType;
  /** @deprecated Prefer `offerings` — kept for callers that only need codes. */
  programs: Program[];
  programLabels?: Record<string, string>;
  offerings: ResultSchoolProgramOption[];
};
