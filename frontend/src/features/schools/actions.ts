"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { ADMIN_BASE_PATH } from "@/constants/auth";
import { ApiError } from "@/services/api-client";
import * as schoolService from "@/services/schools";
import {
  schoolFormSchema,
  type SchoolFormField,
  type SchoolFormState,
  type SchoolFormValues,
} from "./schema";

const FORM_FIELDS = Object.keys(schoolFormSchema.shape).filter(
  (field) => field !== "programs",
) as Exclude<SchoolFormField, "programs">[];

function readFormValues(formData: FormData): SchoolFormValues {
  const values: SchoolFormValues = {
    programs: formData.getAll("programs").map(String),
  };

  for (const field of FORM_FIELDS) {
    values[field] = String(formData.get(field) ?? "");
  }

  return values;
}

function fieldErrorsFromApi(details: unknown) {
  if (!Array.isArray(details)) return undefined;

  const fieldErrors: Partial<Record<SchoolFormField, string[]>> = {};

  for (const issue of details) {
    const field = issue?.path?.[0] as SchoolFormField | undefined;
    if (field && typeof issue.message === "string") {
      (fieldErrors[field] ??= []).push(issue.message);
    }
  }

  return fieldErrors;
}

function errorState(
  values: SchoolFormValues,
  extra: { message?: string; fieldErrors?: Partial<Record<SchoolFormField, string[]>> },
): SchoolFormState {
  return { status: "error", values, submittedAt: Date.now(), ...extra };
}

async function saveSchool(
  formData: FormData,
  save: (input: z.output<typeof schoolFormSchema>) => Promise<{ id: string }>,
): Promise<SchoolFormState> {
  const values = readFormValues(formData);
  const parsed = schoolFormSchema.safeParse(values);

  if (!parsed.success) {
    return errorState(values, {
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    const school = await save(parsed.data);
    revalidatePath(ADMIN_BASE_PATH, "layout");
    return { status: "success", schoolId: school.id, submittedAt: Date.now() };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof ApiError && error.status === 400) {
      return errorState(values, {
        message: "Please fix the highlighted fields.",
        fieldErrors: fieldErrorsFromApi(error.details),
      });
    }

    if (error instanceof ApiError && error.status === 404) {
      return errorState(values, { message: "This school no longer exists." });
    }

    if (error instanceof ApiError && error.status < 500) {
      return errorState(values, { message: error.message });
    }

    console.error("Failed to save school", error);
    return errorState(values, {
      message: "We couldn't save the school right now. Please try again.",
    });
  }
}

export async function createSchoolAction(
  _state: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  return saveSchool(formData, schoolService.createSchool);
}

export async function updateSchoolAction(
  schoolId: string,
  _state: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  return saveSchool(formData, (input) =>
    schoolService.updateSchool(schoolId, input),
  );
}

export async function deleteSchoolAction(
  schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await schoolService.deleteSchool(schoolId);
    revalidatePath(ADMIN_BASE_PATH, "layout");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof ApiError && error.status === 404) {
      revalidatePath(ADMIN_BASE_PATH, "layout");
      return { ok: false, message: "This school was already deleted." };
    }
    return { ok: false, message: "We couldn't delete the school. Please try again." };
  }
}
