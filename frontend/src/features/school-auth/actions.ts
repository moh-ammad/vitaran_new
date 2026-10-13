"use server";

import { redirect } from "next/navigation";
import { attemptLogin } from "@/features/auth/attempt-login";
import type { LoginFormState } from "@/features/auth/schema";
import { loginSchool } from "@/services/auth";
import { schoolLoginSchema } from "./schema";
import { createSchoolSession, deleteSchoolSession } from "./session";

export async function schoolLogin(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const failure = await attemptLogin(formData, schoolLoginSchema, async (credentials) => {
    const { token, expiresAt } = await loginSchool(credentials);
    await createSchoolSession(token, expiresAt);
  });
  if (failure) return failure;

  redirect("/");
}

export async function schoolLogout() {
  await deleteSchoolSession();
  redirect("/");
}
