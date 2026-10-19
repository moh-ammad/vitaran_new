"use server";

import { listSchoolAnswerKeys, listTeacherAnswerKeys } from "@/services/answer-keys";
import type { PdfDocument } from "@/types/document";

export async function loadSchoolPortalAnswerKeysAction(): Promise<PdfDocument[]> {
  return listSchoolAnswerKeys();
}

export async function loadTeacherPortalAnswerKeysAction(): Promise<PdfDocument[]> {
  return listTeacherAnswerKeys();
}
