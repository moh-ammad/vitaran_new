import { z } from "zod";
import { SchoolType, Subject } from "../generated/prisma/enums.js";

const programCode = z.string().trim().min(1).max(64);

export const uploadAnswerKeyQuerySchema = z.object({
  program: programCode,
  type: z.enum(SchoolType),
  schoolId: z.uuid().optional(),
  testId: z.string().trim().min(1).max(64),
  testNumber: z.coerce.number().int().min(1).max(100),
  classLevel: z.coerce.number().int().min(1).max(12),
  fileName: z.string().trim().min(1).max(255).optional(),
});

export const updateAnswerKeyQuerySchema = uploadAnswerKeyQuerySchema;

export const listAnswerKeysQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  testNumber: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(SchoolType).optional(),
  schoolId: z.uuid().optional(),
});

export const schoolTestsQuerySchema = z.object({
  schoolId: z.uuid(),
});

export const answerKeyIdParamsSchema = z.object({
  id: z.uuid(),
});

const questionKey = z.string().regex(/^\d+$/);

export const saveAnswerKeyAnswersSchema = z.object({
  answers: z.record(questionKey, z.enum(["A", "B", "C", "D"])),
  explanations: z.record(questionKey, z.string().max(4000)).default({}),
  printedAnswers: z.record(questionKey, z.enum(["A", "B", "C", "D"])).optional(),
  subjectRanges: z
    .array(
      z.object({
        subject: z.enum(Subject),
        from: z.number().int().min(1).max(200),
        to: z.number().int().min(1).max(200),
        maxMarks: z.number().int().min(0).max(1000),
      }),
    )
    .default([]),
});

export type UploadAnswerKeyQuery = z.infer<typeof uploadAnswerKeyQuerySchema>;
export type UpdateAnswerKeyQuery = z.infer<typeof updateAnswerKeyQuerySchema>;
export type ListAnswerKeysQuery = z.infer<typeof listAnswerKeysQuerySchema>;
export type SchoolTestsQuery = z.infer<typeof schoolTestsQuerySchema>;
export type SaveAnswerKeyAnswersInput = z.infer<typeof saveAnswerKeyAnswersSchema>;
