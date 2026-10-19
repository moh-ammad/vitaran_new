import { z } from "zod";
import { CLASS_LEVELS } from "@/features/documents/constants";
import { testNumberField, type DocumentFormState } from "@/features/documents/schema";
import { classFileField, EXCEL_MAX_BYTES } from "./constants";

/** Empty or missing class slots are fine — edit forms only render some levels. */
const optionalExcelFile = z.preprocess(
  (value) => {
    if (value == null) return undefined;
    if (value instanceof File && value.size === 0) return undefined;
    return value;
  },
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
  program: z.union([z.string().trim().min(1).max(64), z.literal("")]).optional(),
  programName: z.string().trim().max(120, "Keep the program name under 120 characters.").optional(),
  testId: z.string().trim().min(1, "Enter the test ID.").max(64, "Keep the test ID under 64 characters."),
  testNumber: testNumberField,
  removeClasses: z.string().optional(),
  ...classFiles,
});

export const RESULT_FIELDS = ["schoolId", "program", "programName", "testId", "testNumber", "removeClasses"] as const;
export const CLASS_FILE_FIELDS = CLASS_LEVELS.map(classFileField);

export type ClassFileField = ReturnType<typeof classFileField>;
export type ResultField = (typeof RESULT_FIELDS)[number] | ClassFileField | "classes";
export type ResultFormState = DocumentFormState<ResultField>;
export type ResultFormValues = Exclude<ResultFormState, undefined | { status: "success" }>["values"];
