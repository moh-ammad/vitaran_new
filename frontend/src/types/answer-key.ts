import type { PdfDocument, Publishable, SchoolRef } from "@/types/document";
import type { Program, SchoolType } from "@/types/school";

export type AnswerKey = PdfDocument & Publishable & {
  type: SchoolType;
  /** Freeform test ID shared with results. */
  testId: string;
  /** Set only for customized answer keys. */
  school: SchoolRef | null;
};

export type AnswerKeyInput = {
  program: Program;
  type: SchoolType;
  schoolId?: string;
  testId: string;
  testNumber: number;
  classLevel: number;
  /** Required on upload; on update, only sent to replace the PDF. */
  file?: File;
};

/** Distinct tests for a school, derived from its answer keys (admin results upload). */
export type SchoolTestOption = {
  testId: string;
  testNumber: number;
  programs: Array<{
    code: Program;
    name: string;
    classLevels: number[];
  }>;
};
