import { z } from "zod";
import { Program, SchoolType } from "../generated/prisma/enums.js";

export const ANSWER_KEY_MAX_BYTES = 10 * 1024 * 1024;

const fileName = z.string().trim().min(1).max(255);

/** Metadata travels in the query string; the request body is the raw PDF. */
const answerKeyMetaSchema = z.object({
  program: z.enum(Program),
  type: z.enum(SchoolType),
  schoolId: z.uuid().optional(),
  testNumber: z.coerce.number().int().min(1).max(100),
  classLevel: z.coerce.number().int().min(1).max(12),
});

const requireSchoolWhenCustomized = <T extends { type: SchoolType; schoolId?: string }>(value: T) =>
  value.type === SchoolType.REGULAR || Boolean(value.schoolId);

const schoolIssue = { path: ["schoolId"], message: "Select a school" };

export const uploadAnswerKeyQuerySchema = answerKeyMetaSchema
  .extend({ fileName })
  .refine(requireSchoolWhenCustomized, schoolIssue);

/** The PDF is optional on update; `fileName` comes with it. */
export const updateAnswerKeyQuerySchema = answerKeyMetaSchema
  .extend({ fileName: fileName.optional() })
  .refine(requireSchoolWhenCustomized, schoolIssue);

export const listAnswerKeysQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const answerKeyIdParamsSchema = z.object({
  id: z.uuid(),
});

export type UploadAnswerKeyQuery = z.infer<typeof uploadAnswerKeyQuerySchema>;
export type UpdateAnswerKeyQuery = z.infer<typeof updateAnswerKeyQuerySchema>;
export type ListAnswerKeysQuery = z.infer<typeof listAnswerKeysQuerySchema>;
