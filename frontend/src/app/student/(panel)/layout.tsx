import { cookies } from "next/headers";
import { Suspense } from "react";
import { StudentHeader } from "@/components/layout/student-header";
import { StudentPageBack } from "@/components/layout/student-page-back";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PanelFallback } from "@/features/admin/dashboard-parts";
import { verifyStudentSession } from "@/features/student-auth/session";

const SIDEBAR_STATE_COOKIE = "student_sidebar_state";

export default async function StudentPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [student, cookieStore] = await Promise.all([verifyStudentSession(), cookies()]);
  const defaultOpen = cookieStore.get(SIDEBAR_STATE_COOKIE)?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{ "--sidebar-width": "10.5rem" } as React.CSSProperties}
      >
        <StudentSidebar student={student} />
        <SidebarInset className="min-w-0 bg-neutral-50">
          <StudentHeader />
          <div className="w-full flex-1 p-4 sm:p-5 lg:px-6 lg:py-6">
            <StudentPageBack />
            <Suspense fallback={<PanelFallback />}>{children}</Suspense>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster theme="light" position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
