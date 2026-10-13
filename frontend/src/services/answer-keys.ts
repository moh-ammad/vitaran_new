import "server-only";
import { ApiError } from "@/services/api-client";
import { adminApi, adminFetch } from "@/services/admin-api";
import type { AnswerKey, AnswerKeyInput } from "@/types/answer-key";

const BASE = "/answer-keys";
const itemPath = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

/** Metadata goes in the query string and the PDF, when there is one, is the body. */
function toRequest({ file, schoolId, ...meta }: AnswerKeyInput) {
  const query = new URLSearchParams({
    program: meta.program,
    type: meta.type,
    testNumber: String(meta.testNumber),
    classLevel: String(meta.classLevel),
  });
  if (schoolId) query.set("schoolId", schoolId);
  if (file) query.set("fileName", file.name);

  return {
    query,
    init: file ? { headers: { "Content-Type": "application/pdf" }, body: file } : {},
  };
}

export function listRecentAnswerKeys() {
  return adminApi<AnswerKey[]>(BASE);
}

export function getAnswerKeyStats() {
  return adminApi<{ total: number }>(`${BASE}/stats`);
}

export async function getAnswerKey(id: string): Promise<AnswerKey | null> {
  try {
    return await adminApi<AnswerKey>(itemPath(id));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export function uploadAnswerKey(input: AnswerKeyInput) {
  const { query, init } = toRequest(input);
  return adminApi<AnswerKey>(`${BASE}?${query}`, { method: "POST", ...init });
}

export function updateAnswerKey(id: string, input: AnswerKeyInput) {
  const { query, init } = toRequest(input);
  return adminApi<AnswerKey>(`${itemPath(id)}?${query}`, { method: "PATCH", ...init });
}

export function deleteAnswerKey(id: string) {
  return adminApi<void>(itemPath(id), { method: "DELETE" });
}

export function fetchAnswerKeyFile(id: string) {
  return adminFetch(`${itemPath(id)}/file`);
}
