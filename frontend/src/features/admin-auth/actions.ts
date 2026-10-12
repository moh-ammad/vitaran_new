"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from "@/constants/auth";
import { ApiError } from "@/services/api-client";
import { loginAdmin } from "@/services/auth";
import { loginFormSchema, type LoginFormState } from "./schema";
import { createAdminSession, deleteAdminSession } from "./session";

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 429)) {
    return error.message;
  }

  return "We couldn't sign you in right now. Please try again shortly.";
}

export async function login(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginFormSchema.safeParse({
    email,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      email,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const { token, expiresAt } = await loginAdmin(parsed.data);
    await createAdminSession(token, expiresAt);
  } catch (error) {
    return { email, message: getLoginErrorMessage(error) };
  }

  redirect(ADMIN_BASE_PATH);
}

export async function logout() {
  await deleteAdminSession();
  redirect(ADMIN_LOGIN_PATH);
}
