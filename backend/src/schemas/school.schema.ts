import { z } from "zod";
import {
  Program,
  SchoolBoard,
  SchoolStatus,
} from "../generated/prisma/enums.js";

const requiredText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

const schoolFields = {
  name: requiredText(2, 200),
  board: z.enum(SchoolBoard),
  status: z.enum(SchoolStatus),
  programs: z
    .array(z.enum(Program))
    .transform((programs) => [...new Set(programs)]),
  principalName: optionalText(120),
  contactName: requiredText(2, 120),
  contactEmail: z.email().trim().toLowerCase().max(254),
  contactPhone: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{10,14}$/, "Invalid phone number")),
  addressLine: requiredText(5, 300),
  city: requiredText(2, 100),
  state: requiredText(2, 100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Invalid pincode"),
  studentStrength: z.number().int().min(1).max(100_000).nullable().optional(),
  notes: optionalText(1000),
};

export const createSchoolSchema = z.object({
  ...schoolFields,
  status: schoolFields.status.default(SchoolStatus.ACTIVE),
  programs: schoolFields.programs.default([]),
});

export const updateSchoolSchema = z
  .object(schoolFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const schoolIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listSchoolsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(SchoolStatus).optional(),
  board: z.enum(SchoolBoard).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "name", "city"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type ListSchoolsQuery = z.infer<typeof listSchoolsQuerySchema>;
