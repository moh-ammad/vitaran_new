import { z } from "zod";
import { PROGRAMS, SCHOOL_TYPES } from "@/types/school";
import { ANSWER_KEY_MAX_BYTES } from "./constants";

export type AnswerKeyFormMode = "create" | "edit";

const pdfFile = z
  .instanceof(File, { error: "Choose a PDF file." })
  .refine((file) => file.size > 0, "Choose a PDF file.")
  .refine(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    "Only PDF files can be uploaded.",
  )
  .refine((file) => file.size <= ANSWER_KEY_MAX_BYTES, "Keep the file under 10 MB.");

/** Browsers submit an empty file when nothing was chosen. */
const optionalPdfFile = z.preprocess(
  (value) => (value instanceof File && value.size === 0 ? undefined : value),
  pdfFile.optional(),
);

export function getAnswerKeySchema(mode: AnswerKeyFormMode) {
  return z
    .object({
      program: z.enum(PROGRAMS, { error: "Select a program." }),
      type: z.enum(SCHOOL_TYPES, { error: "Select a type." }),
      schoolId: z.string().trim().optional(),
      testNumber: z.coerce.number({ error: "Select a test." }).int().min(1, "Select a test.").max(100),
      classLevel: z.coerce.number({ error: "Select a class." }).int().min(1, "Select a class.").max(12),
      file: mode === "create" ? pdfFile : optionalPdfFile,
    })
    .refine((value) => value.type === "REGULAR" || value.schoolId, {
      path: ["schoolId"],
      message: "Select a school.",
    })
    .transform(({ schoolId, ...value }) =>
      value.type === "CUSTOMIZED" ? { ...value, schoolId } : value,
    );
}

export type AnswerKeyField = "program" | "type" | "schoolId" | "testNumber" | "classLevel" | "file";

/** Select values to restore after a failed save; files can't be restored. */
export type AnswerKeyFormValues = Partial<Record<Exclude<AnswerKeyField, "file">, string>>;

export type AnswerKeyFormState =
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<AnswerKeyField, string[]>>;
      values: AnswerKeyFormValues;
      submittedAt: number;
    }
  | { status: "success"; submittedAt: number }
  | undefined;

export function readAnswerKeyForm(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  return {
    values: {
      program: text("program"),
      type: text("type"),
      schoolId: text("schoolId"),
      testNumber: text("testNumber"),
      classLevel: text("classLevel"),
    } satisfies AnswerKeyFormValues,
    file: formData.get("file"),
  };
}
