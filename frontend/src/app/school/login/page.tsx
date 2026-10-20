import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookOpenCheck, ClipboardCheck, ScanLine, Trophy } from "lucide-react";
import {
  SCHOOL_HOME_PATH,
  SCHOOL_SESSION_COOKIE,
  TEACHER_HOME_PATH,
  TEACHER_SESSION_COOKIE,
} from "@/constants/auth";
import { AuthShell } from "@/features/auth/auth-shell";
import { PortalLoginForm } from "@/features/auth/portal-login-form";

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

export default async function PortalLoginPage() {
  // Cookie presence is enough here; the panel layouts verify the token.
  const cookieStore = await cookies();
  if (cookieStore.has(SCHOOL_SESSION_COOKIE)) redirect(SCHOOL_HOME_PATH);
  if (cookieStore.has(TEACHER_SESSION_COOKIE)) redirect(TEACHER_HOME_PATH);

  return (
    <AuthShell
      badge="School & teacher portal"
      title={
        <>
          Sign in to your <span className="text-gradient">portal</span>
        </>
      }
      description="One login for schools and teachers. We’ll take you to the right portal."
      highlights={highlights}
      footnote={
        <>
          Use the login details shared by Vitaran or your school.{" "}
          <Link
            href="/school/student/login"
            className="font-medium text-brand-800 underline-offset-2 hover:underline"
          >
            Student sign in
          </Link>
          {" "}
          (/school/student/login).
        </>
      }
    >
      <PortalLoginForm />
    </AuthShell>
  );
}
