import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
import { SCHOOL_LOGIN_PATH, STUDENT_HOME_PATH } from "@/constants/auth";
import { AuthShell } from "@/features/auth/auth-shell";
import { googleErrorMessage } from "@/features/auth/google-errors";
import { StudentLoginForm } from "@/features/student-auth/student-login-form";
import { getStudentSession } from "@/features/student-auth/session";

export const metadata: Metadata = {
  title: "Student Sign In",
};

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Resources",
    description: "Solution books for your program and class.",
  },
];

export default async function StudentLoginPage({
  searchParams,
}: PageProps<"/school/student/login">) {
  if (await getStudentSession()) redirect(STUDENT_HOME_PATH);
  const { error } = await searchParams;

  return (
    <AuthShell
      badge="Student portal"
      title={
        <>
          Sign in with your <span className="text-gradient">roll number</span>
        </>
      }
      description="Use your roll number or parent/guardian email. Continue with Google only if that Gmail is already on the student record."
      highlights={highlights}
      switcher={{
        href: SCHOOL_LOGIN_PATH,
        label: "School or teacher sign in",
        hint: "School or teacher?",
      }}
      footnote="Ask your school for your roll number and password."
    >
      <StudentLoginForm googleError={googleErrorMessage(error)} />
    </AuthShell>
  );
}
