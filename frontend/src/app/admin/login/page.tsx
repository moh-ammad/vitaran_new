import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpenCheck, ClipboardCheck, FileSearch } from "lucide-react";
import { ADMIN_BASE_PATH } from "@/constants/auth";
import { login } from "@/features/admin-auth/actions";
import { getAdminSession } from "@/features/admin-auth/session";
import { AuthShell } from "@/features/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
};

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Teacher resources",
    description: "Publish and organise solution books for every programme.",
  },
  {
    icon: ClipboardCheck,
    title: "Answer keys",
    description: "Keep answer keys up to date for schools and partners.",
  },
  {
    icon: FileSearch,
    title: "Results",
    description: "Release exam results securely to students.",
  },
];

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect(ADMIN_BASE_PATH);

  return (
    <AuthShell
      badge="Admin portal"
      title={
        <>
          Welcome back to the <span className="text-gradient">admin console</span>
        </>
      }
      description="Sign in to manage the content that schools, teachers and students rely on."
      highlights={highlights}
      footnote="Restricted area. Access is limited to authorised staff."
    >
      <LoginForm
        action={login}
        title="Admin sign in"
        description="Use the credentials issued to your admin account."
        identifier={{ label: "Email", type: "email", placeholder: "admin@vitaran.com" }}
      />
    </AuthShell>
  );
}
