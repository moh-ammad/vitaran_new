import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpenCheck, ClipboardCheck, ScanLine, Trophy } from "lucide-react";
import { SCHOOL_HOME_PATH, STUDENT_LOGIN_PATH, TEACHER_HOME_PATH } from "@/constants/auth";
import { AuthShell } from "@/features/auth/auth-shell";
import { googleErrorMessage } from "@/features/auth/google-errors";
import { PortalLoginForm } from "@/features/auth/portal-login-form";
import { getSchoolSession } from "@/features/school-auth/session";
import { getTeacherSession } from "@/features/teacher-auth/session";

export const metadata: Metadata = {
  title: "Portal Sign In",
};

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Resources",
    description: "Solution books for every program and assigned class.",
  },
  {
    icon: ClipboardCheck,
    title: "Answer keys",
    description: "Published answer keys for your school or classes.",
  },
  {
    icon: Trophy,
    title: "Results",
    description: "Test results for your school and assigned classes.",
  },
  {
    icon: ScanLine,
    title: "OMR Scan",
    description: "Teachers can capture OMR sheets for their tests.",
  },
];

export default async function PortalLoginPage({
  searchParams,
}: PageProps<"/school/login">) {
  const [school, teacher] = await Promise.all([getSchoolSession(), getTeacherSession()]);
  if (school) redirect(SCHOOL_HOME_PATH);
  if (teacher) redirect(TEACHER_HOME_PATH);
  const { error } = await searchParams;

  return (
    <AuthShell
      badge="School & teacher portal"
      title={
        <>
          Sign in to your <span className="text-gradient">portal</span>
        </>
      }
      description="One login for schools and teachers. Continue with Google only if that Gmail is already on the account."
      highlights={highlights}
      switcher={{
        href: STUDENT_LOGIN_PATH,
        label: "Student sign in",
        hint: "Are you a student?",
      }}
      footnote="Use the login details shared by Vitaran or your school."
    >
      <PortalLoginForm googleError={googleErrorMessage(error)} />
    </AuthShell>
  );
}
