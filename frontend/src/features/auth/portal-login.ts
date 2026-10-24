"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  RETURN_TO_COOKIE,
  SCHOOL_HOME_PATH,
  TEACHER_HOME_PATH,
  safePortalReturnPath,
} from "@/constants/auth";
import { ApiError } from "@/services/api-client";
import { loginSchool, loginTeacher } from "@/services/auth";
import { createSchoolSession } from "@/features/school-auth/session";
import { createTeacherSession } from "@/features/teacher-auth/session";
import { passwordField, type LoginFormState } from "./schema";

const portalLoginSchema = z.object({
  identifier: z.string().trim().min(1, { error: "Enter your email or phone number." }),
  password: passwordField,
});

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && [401, 403, 429].includes(error.status)) {
    return error.message;
  }
  return "We couldn't sign you in right now. Please try again shortly.";
}

/**
 * One portal login for schools and teachers.
 * Tries school credentials first; on wrong credentials, tries teacher.
 */
export async function portalLogin(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const identifier = String(formData.get("identifier") ?? "");
  const parsed = portalLoginSchema.safeParse({
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

  const credentials = parsed.data;
  let role: "school" | "teacher" | null = null;

  try {
    try {
      const { token, expiresAt } = await loginSchool(credentials);
      await createSchoolSession(token, expiresAt);
      role = "school";
    } catch (error) {
      // Wrong school credentials → try teacher. Inactive / rate-limit stop here.
      if (error instanceof ApiError && error.status === 403) throw error;
      if (error instanceof ApiError && error.status === 429) throw error;
      if (!(error instanceof ApiError && error.status === 401)) throw error;

      const { token, expiresAt } = await loginTeacher(credentials);
      await createTeacherSession(token, expiresAt);
      role = "teacher";
    }
  } catch (error) {
    return { identifier, message: loginErrorMessage(error), submittedAt: Date.now() };
  }

  const cookieStore = await cookies();
  const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value;
  cookieStore.delete(RETURN_TO_COOKIE);

  if (role === "teacher") {
    redirect(safePortalReturnPath(returnTo, "teacher", TEACHER_HOME_PATH));
  }
  redirect(safePortalReturnPath(returnTo, "school", SCHOOL_HOME_PATH));
}
