import type { Program } from "@/types/school";

export type SchoolRef = { id: string; name: string; code: string };

/** A PDF published for a program, test and class (answer keys and results). */
export type PdfDocument = {
  id: string;
  program: Program;
  testNumber: number;
  classLevel: number;
  fileName: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
};

/** Schools only see what the admin has published. */
export type Publishable = {
  published: boolean;
  publishedAt: string | null;
};

export type ContentStats = { total: number; published: number };

export type DeleteResult = { ok: true } | { ok: false; message: string };
