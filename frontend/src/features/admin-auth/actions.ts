"use server";

import { redirect } from "next/navigation";
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from "@/constants/auth";
import { attemptLogin } from "@/features/auth/attempt-login";
import type { LoginFormState } from "@/features/auth/schema";
import { loginAdmin } from "@/services/auth";
import { adminLoginSchema } from "./schema";
import { createAdminSession, deleteAdminSession } from "./session";

export async function login(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const failure = await attemptLogin(formData, adminLoginSchema, async ({ identifier, password }) => {
    const { token, expiresAt } = await loginAdmin({ email: identifier, password });
    await createAdminSession(token, expiresAt);
  });
  if (failure) return failure;

  redirect(ADMIN_BASE_PATH);
}

export async function logout() {
  await deleteAdminSession();
  redirect(ADMIN_LOGIN_PATH);
}
