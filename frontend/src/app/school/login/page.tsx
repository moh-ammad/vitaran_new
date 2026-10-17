import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BookOpenCheck, ClipboardCheck, ScanLine, Trophy } from "lucide-react";
import {
  RETURN_TO_COOKIE,
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

function defaultRoleFromReturnTo(returnTo: string | undefined): "school" | "teacher" {
  if (!returnTo) return "school";
  if (
    returnTo.startsWith("/teacher") ||
    returnTo.startsWith("/answer-keys") ||
    returnTo.startsWith("/results") ||
    returnTo.startsWith("/teachers-resources")
  ) {
    return "teacher";
  }
  return "school";
}

export default async function PortalLoginPage() {
  // Cookie presence is enough here; the panel layouts verify the token.
  // Avoids flashing the login form when a school/teacher session already exists.
  const cookieStore = await cookies();
  if (cookieStore.has(SCHOOL_SESSION_COOKIE)) redirect(SCHOOL_HOME_PATH);
  if (cookieStore.has(TEACHER_SESSION_COOKIE)) redirect(TEACHER_HOME_PATH);

  const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value;
  const defaultRole = defaultRoleFromReturnTo(returnTo);

  return (
    <AuthShell
      badge="School & teacher portal"
      title={
        <>
          Sign in to your <span className="text-gradient">portal</span>
        </>
      }
      description="Schools manage teachers and content. Teachers access resources, answer keys, results and OMR scan."
      highlights={highlights}
      footnote="Use the login details shared by Vitaran or your school."
    >
      <PortalLoginForm defaultRole={defaultRole} />
    </AuthShell>
  );
}
