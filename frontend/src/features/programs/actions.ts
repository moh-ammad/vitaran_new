"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { ADMIN_BASE_PATH } from "@/constants/auth";
import { ApiError } from "@/services/api-client";
import * as programService from "@/services/programs";
import { SUBJECTS, type Subject } from "@/types/school";

const programSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the program name.").max(120),
    year: z.coerce.number().int().min(2020).max(2100),
    classFrom: z.coerce.number().int().min(1).max(12),
    classTo: z.coerce.number().int().min(1).max(12),
    subjects: z.array(z.enum(SUBJECTS)).min(1, "Select at least one subject."),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z][A-Z0-9_]{1,63}$/, "Use letters, numbers and underscores.")
      .optional()
      .or(z.literal("")),
  })
  .refine((value) => value.classFrom <= value.classTo, {
    message: "Class from must be ≤ class to.",
    path: ["classTo"],
  });

export type ProgramFormValues = {
  name: string;
  year: string;
  classFrom: string;
  classTo: string;
  subjects: string[];
  code: string;
};

export type ProgramFormState =
  | {
      status: "error";
      message?: string;
      fieldErrors?: Partial<Record<keyof ProgramFormValues, string[]>>;
      values: ProgramFormValues;
    }
  | { status: "success"; programId: string }
  | undefined;

function readValues(formData: FormData): ProgramFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    year: String(formData.get("year") ?? ""),
    classFrom: String(formData.get("classFrom") ?? ""),
    classTo: String(formData.get("classTo") ?? ""),
    subjects: formData.getAll("subjects").map(String),
    code: String(formData.get("code") ?? ""),
  };
}

async function save(
  formData: FormData,
  persist: (input: z.infer<typeof programSchema>) => Promise<{ id: string }>,
): Promise<ProgramFormState> {
  const values = readValues(formData);
  const parsed = programSchema.safeParse({
    ...values,
    code: values.code || undefined,
    subjects: values.subjects as Subject[],
  });

  if (!parsed.success) {
    return {
      status: "error",
      values,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const program = await persist(parsed.data);
    revalidatePath(ADMIN_BASE_PATH, "layout");
    return { status: "success", programId: program.id };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError && (error.status === 400 || error.status === 409)) {
      return { status: "error", values, message: error.message };
    }
    return { status: "error", values, message: "Could not save the program. Please try again." };
  }
}

export async function createProgramAction(
  _state: ProgramFormState,
  formData: FormData,
): Promise<ProgramFormState> {
  return save(formData, (input) => programService.createProgram(input));
}

export async function updateProgramAction(
  id: string,
  _state: ProgramFormState,
  formData: FormData,
): Promise<ProgramFormState> {
  return save(formData, (input) => programService.updateProgram(id, input));
}

export async function deleteProgramAction(id: string) {
  try {
    await programService.deleteProgram(id);
    revalidatePath(ADMIN_BASE_PATH, "layout");
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return { ok: false as const, message: error.message };
    }
    return { ok: false as const, message: "Could not delete the program." };
  }
}
