"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  RETURN_TO_COOKIE,
  STUDENT_HOME_PATH,
  STUDENT_LOGIN_PATH,
  safePortalReturnPath,
} from "@/constants/auth";
import { ApiError } from "@/services/api-client";
import { loginStudent } from "@/services/auth";
import { createStudentSession, deleteStudentSession } from "@/features/student-auth/session";
import { passwordField } from "@/features/auth/schema";

const studentLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { error: "Enter your roll number or parent/guardian email." }),
  password: passwordField,
});

export type StudentLoginFormState =
  | {
      identifier?: string;
      fieldErrors?: Partial<Record<"identifier" | "password", string[]>>;
      message?: string;
      submittedAt: number;
    }
  | undefined;

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && [401, 403, 429].includes(error.status)) {
    return error.message;
  }
  return "We couldn't sign you in right now. Please try again shortly.";
}

export async function studentPortalLogin(
  _state: StudentLoginFormState,
  formData: FormData,
): Promise<StudentLoginFormState> {
  const identifier = String(formData.get("identifier") ?? "");
  const parsed = studentLoginSchema.safeParse({
    identifier,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      identifier,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      submittedAt: Date.now(),
    };
  }

  try {
    const { token, expiresAt } = await loginStudent(parsed.data);
    await createStudentSession(token, expiresAt);
  } catch (error) {
    return {
      identifier,
      message: loginErrorMessage(error),
      submittedAt: Date.now(),
    };
  }

  const cookieStore = await cookies();
  const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value;
  cookieStore.delete(RETURN_TO_COOKIE);
  redirect(safePortalReturnPath(returnTo, "student", STUDENT_HOME_PATH));
}

export async function studentLogout() {
  await deleteStudentSession();
  redirect(STUDENT_LOGIN_PATH);
}
