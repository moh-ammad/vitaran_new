import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH, ADMIN_SESSION_COOKIE } from "@/constants/auth";
import { createSession } from "@/lib/session";
import { fetchCurrentAdmin } from "@/services/auth";
import type { AdminProfile } from "@/types/auth";

const adminSession = createSession<AdminProfile>({
  cookieName: ADMIN_SESSION_COOKIE,
  path: ADMIN_BASE_PATH,
  fetchProfile: fetchCurrentAdmin,
});

export const createAdminSession = adminSession.create;
export const getAdminSession = adminSession.get;

export async function deleteAdminSession() {
  await adminSession.remove();
  // Some older sessions were issued site-wide; clear those too.
  (await cookies()).delete({ name: ADMIN_SESSION_COOKIE, path: "/" });
}

/**
 * For admin-only pages. The proxy already redirects when there's no cookie;
 * this also catches expired or revoked tokens.
 */
export async function verifyAdminSession(): Promise<AdminProfile> {
  const admin = await getAdminSession();
  if (!admin) redirect(ADMIN_LOGIN_PATH);
  return admin;
}
