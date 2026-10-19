import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
import { STUDENT_HOME_PATH, STUDENT_SESSION_COOKIE } from "@/constants/auth";
import { AuthShell } from "@/features/auth/auth-shell";
import { StudentLoginForm } from "@/features/student-auth/student-login-form";

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

export default async function StudentLoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.has(STUDENT_SESSION_COOKIE)) redirect(STUDENT_HOME_PATH);

  return (
    <AuthShell
      badge="Student portal"
      title={
        <>
          Sign in with your <span className="text-gradient">roll number</span>
        </>
      }
      description="Use your roll number or parent/guardian email, plus the password your school gave you."
      highlights={highlights}
      footnote="Ask your school for your roll number and password. Forgot password uses the email on your account."
    >
      <StudentLoginForm />
    </AuthShell>
  );
}
