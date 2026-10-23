import type { PdfDocument, Publishable, SchoolRef } from "@/types/document";
import type { Program, SchoolType, Subject } from "@/types/school";

export type AnswerOption = "A" | "B" | "C" | "D";

export type SubjectRange = {
  subject: Subject;
  from: number;
  to: number;
  maxMarks: number;
};

export type AnswerCorrection = {
  question: number;
  from: AnswerOption | null;
  to: AnswerOption | null;
  explanation: string;
};

export type AnswerKey = PdfDocument & Publishable & {
  type: SchoolType;
  /** Freeform test ID shared with results. */
  testId: string;
  /** Set only for customized answer keys. */
  school: SchoolRef | null;
  answers?: Record<string, AnswerOption>;
  explanations?: Record<string, string>;
  printedAnswers?: Record<string, AnswerOption>;
  printedExplanations?: Record<string, string>;
  corrections?: AnswerCorrection[];
  subjectRanges?: SubjectRange[];
  answerCount?: number;
  correctionCount?: number;
};

export type AnswerKeyDetail = AnswerKey & {
  answers: Record<string, AnswerOption>;
  explanations: Record<string, string>;
  printedAnswers: Record<string, AnswerOption>;
  printedExplanations: Record<string, string>;
  corrections: AnswerCorrection[];
  subjectRanges: SubjectRange[];
  answerCount: number;
  correctionCount: number;
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
