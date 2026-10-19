import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STUDENT_LOGIN_PATH, STUDENT_SESSION_COOKIE } from "@/constants/auth";
import { ApiError, apiClient } from "@/services/api-client";

async function authHeaders() {
  const token = (await cookies()).get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) redirect(STUDENT_LOGIN_PATH);
  return { Authorization: `Bearer ${token}` };
}

/** API calls on behalf of the signed-in student. */
export async function studentApi<T>(path: string): Promise<T> {
  try {
    return await apiClient<T>(path, { headers: await authHeaders(), cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(STUDENT_LOGIN_PATH);
    throw error;
  }
}
