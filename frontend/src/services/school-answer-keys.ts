import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SCHOOL_LOGIN_PATH, SCHOOL_SESSION_COOKIE } from "@/constants/auth";
import { ApiError, apiClient, buildApiUrl } from "@/services/api-client";
import type { AnswerKey } from "@/types/answer-key";

const BASE = "/school/answer-keys";

async function authHeaders() {
  const token = (await cookies()).get(SCHOOL_SESSION_COOKIE)?.value;
  if (!token) redirect(SCHOOL_LOGIN_PATH);
  return { Authorization: `Bearer ${token}` };
}

/** Only the keys this school may see: regular keys for its programs, or its own customized keys. */
export async function listSchoolAnswerKeys(): Promise<AnswerKey[]> {
  try {
    return await apiClient<AnswerKey[]>(BASE, { headers: await authHeaders(), cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(SCHOOL_LOGIN_PATH);
    throw error;
  }
}

export async function fetchSchoolAnswerKeyFile(id: string): Promise<Response> {
  return fetch(buildApiUrl(`${BASE}/${encodeURIComponent(id)}/file`), {
    headers: await authHeaders(),
    cache: "no-store",
  });
}
