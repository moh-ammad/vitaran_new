import { z } from "zod";
import {
  PROGRAMS,
  SCHOOL_BOARDS,
  SCHOOL_STATUSES,
  type SchoolInput,
} from "@/types/school";
import { SCHOOLS_PAGE_SIZE } from "./constants";

const emptyToNull = (value: string) => (value === "" ? null : value);

export const schoolFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the school name.")
    .max(200, "Keep the name under 200 characters."),
  board: z.enum(SCHOOL_BOARDS, { error: "Select a board." }),
  status: z.enum(SCHOOL_STATUSES, { error: "Select a status." }),
  programs: z.array(z.enum(PROGRAMS)),
  principalName: z.string().trim().max(120).transform(emptyToNull),
  contactName: z
    .string()
    .trim()
    .min(2, "Enter the contact person's name.")
    .max(120),
  contactEmail: z
    .email({ error: "Enter a valid email address." })
    .trim()
    .toLowerCase(),
  contactPhone: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(
      z.string().regex(/^\+?\d{10,14}$/, "Enter a valid 10-digit phone number."),
    ),
  addressLine: z
    .string()
    .trim()
    .min(5, "Enter the street address.")
    .max(300),
  city: z.string().trim().min(2, "Enter the city.").max(100),
  state: z.string().trim().min(2, "Select a state.").max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode."),
  studentStrength: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 100_000),
      "Enter a number between 1 and 100,000.",
    )
    .transform((value) => (value === "" ? null : Number(value))),
  notes: z
    .string()
    .trim()
    .max(1000, "Keep notes under 1000 characters.")
    .transform(emptyToNull),
}) satisfies z.ZodType<SchoolInput, unknown>;

export type SchoolFormField = keyof z.input<typeof schoolFormSchema>;

export type SchoolFormValues = Partial<
  Record<Exclude<SchoolFormField, "programs">, string>
> & {
  programs?: string[];
};

export type SchoolFormState =
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<SchoolFormField, string[]>>;
      values: SchoolFormValues;
      submittedAt: number;
    }
  | { status: "success"; schoolId: string; submittedAt: number }
  | undefined;

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

export const schoolListParamsSchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  status: optionalEnum(SCHOOL_STATUSES),
  board: optionalEnum(SCHOOL_BOARDS),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(SCHOOLS_PAGE_SIZE),
});
