import { z } from "zod";
import { CLASS_LEVELS } from "@/features/documents/constants";
import { testNumberField, type DocumentFormState } from "@/features/documents/schema";
import { PROGRAMS } from "@/types/school";
import { classFileField, EXCEL_MAX_BYTES } from "./constants";

/** Browsers submit an empty file for class rows left blank. */
const optionalExcelFile = z.preprocess(
  (value) => (value instanceof File && value.size === 0 ? undefined : value),
  z
    .instanceof(File)
    .refine((file) => file.name.toLowerCase().endsWith(".xlsx"), "Only Excel (.xlsx) files can be uploaded.")
    .refine((file) => file.size <= EXCEL_MAX_BYTES, "Keep the file under 2 MB.")
    .optional(),
);

const classFiles = Object.fromEntries(
  CLASS_LEVELS.map((level) => [classFileField(level), optionalExcelFile]),
) as Record<ClassFileField, typeof optionalExcelFile>;

export type ResultSetInput = z.infer<typeof resultSetSchema>;

/** The API decides whether `program` or `programName` applies, based on the school's type. */
export const resultSetSchema = z.object({
  schoolId: z.string().trim().min(1, "Select a school."),
  program: z.union([z.enum(PROGRAMS), z.literal("")]).optional(),
  programName: z.string().trim().max(120, "Keep the program name under 120 characters.").optional(),
  testNumber: testNumberField,
  removeClasses: z.string().optional(),
  ...classFiles,
});

export const RESULT_FIELDS = ["schoolId", "program", "programName", "testNumber", "removeClasses"] as const;
export const CLASS_FILE_FIELDS = CLASS_LEVELS.map(classFileField);

export type ClassFileField = ReturnType<typeof classFileField>;
export type ResultField = (typeof RESULT_FIELDS)[number] | ClassFileField | "classes";
export type ResultFormState = DocumentFormState<ResultField>;
export type ResultFormValues = Exclude<ResultFormState, undefined | { status: "success" }>["values"];
