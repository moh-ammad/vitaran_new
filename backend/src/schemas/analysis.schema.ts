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

export const rankingQuerySchema = z.object({
  school: z.preprocess(emptyToUndefined, z.uuid().optional()),
  program: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(64).optional()),
  class: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(12).optional()),
  mode: z.preprocess(emptyToUndefined, z.enum(["test", "overall"]).optional()),
  test: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(64).optional()),
});

export type RankingQuery = z.infer<typeof rankingQuerySchema>;

export const rankingFileQuerySchema = rankingQuerySchema.extend({
  format: z.enum(["xlsx", "pdf"]),
});

export type RankingFileQuery = z.infer<typeof rankingFileQuerySchema>;
