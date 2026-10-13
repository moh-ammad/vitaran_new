"use server";

import { deleteDocument, saveDocument } from "@/features/documents/save";
import * as answerKeyService from "@/services/answer-keys";
import { ANSWER_KEY_NOUN, ANSWER_KEYS_PATH } from "./constants";
import { ANSWER_KEY_FIELDS, getAnswerKeySchema, type AnswerKeyFormState } from "./schema";

const options = { fields: ANSWER_KEY_FIELDS, revalidate: ANSWER_KEYS_PATH, noun: ANSWER_KEY_NOUN };

export async function uploadAnswerKeyAction(
  _state: AnswerKeyFormState,
  formData: FormData,
): Promise<AnswerKeyFormState> {
  return saveDocument({
    ...options,
    formData,
    schema: getAnswerKeySchema("create"),
    save: answerKeyService.uploadAnswerKey,
  });
}

export async function updateAnswerKeyAction(
  id: string,
  _state: AnswerKeyFormState,
  formData: FormData,
): Promise<AnswerKeyFormState> {
  return saveDocument({
    ...options,
    formData,
    schema: getAnswerKeySchema("edit"),
    save: (input) => answerKeyService.updateAnswerKey(id, input),
  });
}

export async function deleteAnswerKeyAction(id: string) {
  return deleteDocument(() => answerKeyService.deleteAnswerKey(id), ANSWER_KEYS_PATH, ANSWER_KEY_NOUN);
}
