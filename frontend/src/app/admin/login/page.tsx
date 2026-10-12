import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardCheck,
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ADMIN_BASE_PATH } from "@/constants/auth";
import { LoginForm } from "@/features/admin-auth/login-form";
import { getAdminSession } from "@/features/admin-auth/session";

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
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-brand-950 text-white">
      <div className="bg-grid absolute inset-0 -z-10 mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 size-200 -translate-x-1/2 rounded-full bg-brand-700/40 blur-[140px]" />
      <div className="absolute right-0 bottom-0 -z-10 size-120 rounded-full bg-glow/20 blur-[120px]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo variant="white" />
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-brand-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Back to website
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-14 px-5 pt-8 pb-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:pt-0">
        <div>
          <p className="animate-in fade-in slide-in-from-bottom-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-brand-200 backdrop-blur duration-700">
            <ShieldCheck className="size-3.5 text-glow" />
            Admin portal
          </p>
          <h1 className="animate-in fade-in slide-in-from-bottom-6 mt-7 text-4xl leading-tight font-extrabold text-balance duration-700 sm:text-5xl">
            Welcome back to the{" "}
            <span className="text-gradient">admin console</span>
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-8 mt-5 max-w-md text-lg leading-relaxed text-brand-200/85 duration-1000">
            Sign in to manage the content that schools, teachers and students
            rely on.
          </p>

          <ul className="mt-10 hidden space-y-5 lg:block">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <item.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="block text-sm text-brand-300">
                    {item.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 w-full max-w-md duration-700 lg:justify-self-end">
          <LoginForm />
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-300">
            <ShieldCheck className="size-3.5" />
            Restricted area. Access is limited to authorised staff.
          </p>
        </div>
      </div>
    </main>
  );
}
