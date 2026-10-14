import type { PdfDocument, Publishable, SchoolRef } from "@/types/document";
import type { Program, SchoolType } from "@/types/school";

export type AnswerKey = PdfDocument & Publishable & {
  type: SchoolType;
  /** Set only for customized answer keys. */
  school: SchoolRef | null;
};

export type AnswerKeyInput = {
  program: Program;
  type: SchoolType;
  schoolId?: string;
  testNumber: number;
  classLevel: number;
  /** Required on upload; on update, only sent to replace the PDF. */
  file?: File;
};
