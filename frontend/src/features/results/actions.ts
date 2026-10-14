"use server";

import { ADMIN_BASE_PATH } from "@/constants/auth";
import { deleteDocument, publishDocument, saveDocument } from "@/features/documents/save";
import * as resultService from "@/services/results";
import {
  CLASS_FILE_FIELDS,
  RESULT_FIELDS,
  resultSetSchema,
  type ResultField,
  type ResultFormState,
  type ResultSetInput,
} from "./schema";

const NOUN = "result";

/** Results also show on school pages and the dashboard, so refresh the whole admin. */
const REVALIDATE_PATH = ADMIN_BASE_PATH;

const options = {
  fields: RESULT_FIELDS,
  fileFields: CLASS_FILE_FIELDS,
  schema: resultSetSchema,
  revalidate: REVALIDATE_PATH,
  noun: NOUN,
};

/** Rebuilds the multipart body the API expects from validated input only. */
function toApiForm(input: ResultSetInput) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value instanceof File) form.append(key, value, value.name);
    else if (value !== undefined && value !== "") form.append(key, String(value));
  }
  return form;
}

export async function uploadResultAction(
  _state: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  return saveDocument<ResultField, ResultSetInput>({
    ...options,
    formData,
    save: (input) => resultService.uploadResultSet(toApiForm(input)),
  });
}

export async function updateResultAction(
  id: string,
  _state: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  return saveDocument<ResultField, ResultSetInput>({
    ...options,
    formData,
    save: (input) => resultService.updateResultSet(id, toApiForm(input)),
  });
}

export async function setResultPublishedAction(id: string, published: boolean) {
  return publishDocument(() => resultService.setResultSetPublished(id, published), REVALIDATE_PATH, NOUN);
}

export async function deleteResultAction(id: string) {
  return deleteDocument(() => resultService.deleteResultSet(id), REVALIDATE_PATH, NOUN);
}
