import "server-only";
import { redirect } from "next/navigation";
import { STUDENT_LOGIN_PATH, STUDENT_SESSION_COOKIE } from "@/constants/auth";
import { createSession } from "@/lib/session";
import { fetchCurrentStudent } from "@/services/auth";
import type { StudentAccount } from "@/types/student";

const studentSession = createSession<StudentAccount>({
  cookieName: STUDENT_SESSION_COOKIE,
  path: "/",
  fetchProfile: fetchCurrentStudent,
});

export const createStudentSession = studentSession.create;
export const deleteStudentSession = studentSession.remove;
export const getStudentSession = studentSession.get;

export async function verifyStudentSession(): Promise<StudentAccount> {
  const student = await getStudentSession();
  if (!student) redirect(STUDENT_LOGIN_PATH);
  return student;
}
