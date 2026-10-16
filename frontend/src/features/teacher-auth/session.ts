import "server-only";
import { redirect } from "next/navigation";
import { TEACHER_LOGIN_PATH, TEACHER_SESSION_COOKIE } from "@/constants/auth";
import { createSession } from "@/lib/session";
import { fetchCurrentTeacher } from "@/services/auth";
import type { TeacherAccount } from "@/types/teacher";

const teacherSession = createSession<TeacherAccount>({
  cookieName: TEACHER_SESSION_COOKIE,
  path: "/",
  fetchProfile: fetchCurrentTeacher,
});

export const createTeacherSession = teacherSession.create;
export const deleteTeacherSession = teacherSession.remove;
export const getTeacherSession = teacherSession.get;

export async function verifyTeacherSession(): Promise<TeacherAccount> {
  const teacher = await getTeacherSession();
  if (!teacher) redirect(TEACHER_LOGIN_PATH);
  return teacher;
}
