import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpenCheck, ClipboardCheck } from "lucide-react";
import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import { schoolLogin } from "@/features/school-auth/actions";
import { getSchoolSession } from "@/features/school-auth/session";

export const metadata: Metadata = {
  title: "School Sign In",
};

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Teachers resources",
    description: "Solution books for every program, in one place.",
  },
  {
    icon: ClipboardCheck,
    title: "Answer keys",
    description: "Answer keys for the Integrated, Advanced and Olympiad programs.",
  },
];

export default async function SchoolLoginPage() {
  if (await getSchoolSession()) redirect("/");

  return (
    <AuthShell
      badge="School portal"
      title={
        <>
          Sign in to your <span className="text-gradient">school account</span>
        </>
      }
      description="Access teachers resources and answer keys for your school."
      highlights={highlights}
      footnote="Use the login details shared with your school by Vitaran."
    >
      <LoginForm
        action={schoolLogin}
        title="School sign in"
        description="Use your school email or phone number."
        identifier={{ label: "Email or phone number", type: "text", placeholder: "school@example.com" }}
      />
    </AuthShell>
  );
}
