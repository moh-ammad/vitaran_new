import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const analysisQuerySchema = z.object({
  school: z.preprocess(emptyToUndefined, z.uuid().optional()),
  program: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(64).optional()),
  class: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(12).optional()),
  section: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  test: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(64).optional()),
  student: z.preprocess(emptyToUndefined, z.uuid().optional()),
});

export type AnalysisQuery = z.infer<typeof analysisQuerySchema>;
