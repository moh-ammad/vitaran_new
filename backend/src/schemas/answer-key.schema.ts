import { z } from "zod";
import { SchoolType } from "../generated/prisma/enums.js";

const programCode = z.string().trim().min(1).max(64);

export const uploadAnswerKeyQuerySchema = z.object({
  program: programCode,
  type: z.enum(SchoolType),
  schoolId: z.uuid().optional(),
  testNumber: z.coerce.number().int().min(1).max(99),
  classLevel: z.coerce.number().int().min(1).max(12),
  fileName: z.string().trim().min(1).max(255).optional(),
});

export const updateAnswerKeyQuerySchema = uploadAnswerKeyQuerySchema;

export const listAnswerKeysQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  testNumber: z.coerce.number().int().min(1).max(99).optional(),
  type: z.enum(SchoolType).optional(),
  schoolId: z.uuid().optional(),
});

export const answerKeyIdParamsSchema = z.object({
  id: z.uuid(),
});

export type UploadAnswerKeyQuery = z.infer<typeof uploadAnswerKeyQuerySchema>;
export type UpdateAnswerKeyQuery = z.infer<typeof updateAnswerKeyQuerySchema>;
export type ListAnswerKeysQuery = z.infer<typeof listAnswerKeysQuerySchema>;
