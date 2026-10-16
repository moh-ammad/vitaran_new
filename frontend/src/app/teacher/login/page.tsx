import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpenCheck, ClipboardCheck, ScanLine, Trophy } from "lucide-react";
import { TEACHER_HOME_PATH } from "@/constants/auth";
import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import { teacherLogin } from "@/features/teacher-auth/actions";
import { getTeacherSession } from "@/features/teacher-auth/session";

export const metadata: Metadata = {
  title: "Teacher Sign In",
};

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Your resources",
    description: "Solution books for the classes and subjects assigned to you.",
  },
  {
    icon: ClipboardCheck,
    title: "Answer keys",
    description: "Answer keys limited to your assigned classes.",
  },
  {
    icon: Trophy,
    title: "Results",
    description: "Results for the classes you teach.",
  },
  {
    icon: ScanLine,
    title: "OMR Scan",
    description: "Capture OMR sheets for your tests and classes.",
  },
];

export default async function TeacherLoginPage() {
  if (await getTeacherSession()) redirect(TEACHER_HOME_PATH);

  return (
    <AuthShell
      badge="Teacher portal"
      title={
        <>
          Sign in as a <span className="text-gradient">teacher</span>
        </>
      }
      description="Access resources, answer keys, results and OMR scan for your assigned classes."
      highlights={highlights}
      footnote="Use the login details shared by your school."
    >
      <LoginForm
        action={teacherLogin}
        title="Teacher sign in"
        description="Use your teacher email or phone number."
        identifier={{
          label: "Email or phone number",
          type: "text",
          placeholder: "teacher@example.com",
        }}
      />
    </AuthShell>
  );
}
