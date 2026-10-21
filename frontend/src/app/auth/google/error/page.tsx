import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GOOGLE_PORTAL_COOKIE,
  SCHOOL_LOGIN_PATH,
  STUDENT_LOGIN_PATH,
} from "@/constants/auth";

export default async function GoogleAuthErrorPage({
  searchParams,
}: PageProps<"/auth/google/error">) {
  const { error } = await searchParams;
  const portal = (await cookies()).get(GOOGLE_PORTAL_COOKIE)?.value;
  const login = portal === "student" ? STUDENT_LOGIN_PATH : SCHOOL_LOGIN_PATH;
  const code = typeof error === "string" && error ? error : "google";
  redirect(`${login}?error=${encodeURIComponent(code)}`);
}
