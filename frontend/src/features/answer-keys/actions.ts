"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/services/api-client";
import * as answerKeyService from "@/services/answer-keys";
import type { AnswerKeyInput } from "@/types/answer-key";
import { ANSWER_KEYS_PATH } from "./constants";
import {
  getAnswerKeySchema,
  readAnswerKeyForm,
  type AnswerKeyField,
  type AnswerKeyFormMode,
  type AnswerKeyFormState,
} from "./schema";

type FieldErrors = Partial<Record<AnswerKeyField, string[]>>;

function fieldErrorsFromApi(details: unknown) {
  if (!Array.isArray(details)) return undefined;

  const fieldErrors: FieldErrors = {};
  for (const issue of details) {
    const field = issue?.path?.[0] as AnswerKeyField | undefined;
    if (field && typeof issue.message === "string") (fieldErrors[field] ??= []).push(issue.message);
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

async function saveAnswerKey(
  formData: FormData,
  mode: AnswerKeyFormMode,
  save: (input: AnswerKeyInput) => Promise<unknown>,
): Promise<AnswerKeyFormState> {
  const { values, file } = readAnswerKeyForm(formData);
  const fail = (extra: { message?: string; fieldErrors?: FieldErrors }) =>
    ({ status: "error", values, submittedAt: Date.now(), ...extra }) as const;

  const parsed = getAnswerKeySchema(mode).safeParse({ ...values, file });
  if (!parsed.success) {
    return fail({
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }

  try {
    await save(parsed.data);
    revalidatePath(ANSWER_KEYS_PATH, "layout");
    return { status: "success", submittedAt: Date.now() };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof ApiError && error.status === 404) {
      return fail({ message: "This answer key no longer exists." });
    }
    if (error instanceof ApiError && error.status < 500) {
      const fieldErrors = fieldErrorsFromApi(error.details);
      return fail({ message: fieldErrors ? "Please fix the highlighted fields." : error.message, fieldErrors });
    }

    console.error("Failed to save answer key", error);
    return fail({ message: "We couldn't save the answer key right now. Please try again." });
  }
}

export async function uploadAnswerKeyAction(
  _state: AnswerKeyFormState,
  formData: FormData,
): Promise<AnswerKeyFormState> {
  return saveAnswerKey(formData, "create", answerKeyService.uploadAnswerKey);
}

export async function updateAnswerKeyAction(
  id: string,
  _state: AnswerKeyFormState,
  formData: FormData,
): Promise<AnswerKeyFormState> {
  return saveAnswerKey(formData, "edit", (input) => answerKeyService.updateAnswerKey(id, input));
}

export async function deleteAnswerKeyAction(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await answerKeyService.deleteAnswerKey(id);
    revalidatePath(ANSWER_KEYS_PATH, "layout");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof ApiError && error.status === 404) {
      revalidatePath(ANSWER_KEYS_PATH, "layout");
      return { ok: false, message: "This answer key was already deleted." };
    }
    return { ok: false, message: "We couldn't delete the answer key. Please try again." };
  }
}
