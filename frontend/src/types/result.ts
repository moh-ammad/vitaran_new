import type { Publishable, SchoolRef } from "@/types/document";
import type { Program, SchoolType } from "@/types/school";

export type ResultClass = {
  classLevel: number;
  rowCount: number;
  fileName: string;
  fileSize: number;
  updatedAt: string;
};

/** One test's results for one school and program. */
export type ResultSet = Publishable & {
  id: string;
  school: SchoolRef & { type: SchoolType };
  /** Regular schools. */
  program: Program | null;
  /** Customized schools. */
  programName: string | null;
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
  updatedAt: string;
};

export type ResultSchoolOption = SchoolRef & { type: SchoolType; programs: Program[] };
