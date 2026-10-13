import type { Program, SchoolType } from "@/types/school";

export type AnswerKey = {
  id: string;
  program: Program;
  type: SchoolType;
  /** Set only for customized answer keys. */
  school: { id: string; name: string; code: string } | null;
  testNumber: number;
  classLevel: number;
  fileName: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
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
