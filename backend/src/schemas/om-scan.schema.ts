import { z } from "zod";

const rollNo = z.string().trim().min(1, "Enter the roll no").max(64);
const testId = z.string().trim().min(1, "Enter the test ID").max(64);

export const omScanTargetQuerySchema = z.object({ rollNo, testId });

export const omScanIdentitySchema = z.object({
  rollNo,
  testId,
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Exam date must be YYYY-MM-DD")
    .refine((value) => {
      const time = Date.parse(`${value}T00:00:00Z`);
      return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
    }, "Exam date is not a real date")
    .refine(
      // One day of slack for time zones ahead of the server.
      (value) => Date.parse(`${value}T00:00:00Z`) <= Date.now() + 24 * 60 * 60 * 1000,
      "Exam date cannot be in the future",
    ),
});

export const omResultReleaseSchema = z.object({
  testId,
  programId: z.uuid(),
  classLevel: z.coerce.number().int().min(1).max(12),
  sectionId: z.uuid().nullable(),
  published: z.boolean(),
});

export type OmResultReleaseInput = z.infer<typeof omResultReleaseSchema>;
export type OmScanTargetQuery = z.infer<typeof omScanTargetQuerySchema>;
export type OmScanIdentityInput = z.infer<typeof omScanIdentitySchema>;
