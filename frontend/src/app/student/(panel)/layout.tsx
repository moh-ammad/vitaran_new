import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import { LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { PanelFallback } from "@/features/admin/dashboard-parts";
import { studentLogout } from "@/features/student-auth/actions";
import { verifyStudentSession } from "@/features/student-auth/session";
import { cn } from "@/lib/utils";

export default async function StudentPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const student = await verifyStudentSession();

  return (
    <div className="min-h-svh bg-neutral-50">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-950">{student.name}</p>
            <p className="truncate text-xs text-neutral-500">
              {student.school.name} · Roll {student.rollNo} · Class {student.classLevel}
              {student.sectionName ? `-${student.sectionName}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/student/resources"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Resources
            </Link>
            <Form action={studentLogout}>
              <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </Form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Suspense fallback={<PanelFallback />}>{children}</Suspense>
      </main>
      <Toaster theme="light" position="top-right" richColors closeButton />
    </div>
  );
}
