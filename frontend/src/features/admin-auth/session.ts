import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_BASE_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
} from "@/constants/auth";
import { ApiError } from "@/services/api-client";
import { fetchCurrentAdmin } from "@/services/auth";
import type { AdminProfile } from "@/types/auth";

export async function createAdminSession(token: string, expiresAt: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: ADMIN_BASE_PATH,
    expires: new Date(expiresAt),
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ADMIN_SESSION_COOKIE, path: ADMIN_BASE_PATH });
}

export const getAdminSession = cache(async (): Promise<AdminProfile | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    return await fetchCurrentAdmin(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function verifyAdminSession(): Promise<AdminProfile> {
  const admin = await getAdminSession();
  if (!admin) redirect(ADMIN_LOGIN_PATH);
  return admin;
}
