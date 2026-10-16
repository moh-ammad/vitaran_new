import { cookies } from "next/headers";
import { SchoolHeader } from "@/components/layout/school-header";
import { SchoolMobileNav } from "@/components/layout/school-mobile-nav";
import { SchoolSidebar } from "@/components/layout/school-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { verifySchoolSession } from "@/features/school-auth/session";

const SIDEBAR_STATE_COOKIE = "school_sidebar_state";

export default async function SchoolPanelLayout({
  children,
}: LayoutProps<"/school">) {
  const [school, cookieStore] = await Promise.all([verifySchoolSession(), cookies()]);
  const defaultOpen = cookieStore.get(SIDEBAR_STATE_COOKIE)?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{ "--sidebar-width": "10.8rem" } as React.CSSProperties}
      >
        <SchoolSidebar school={school} />
        <SidebarInset className="min-w-0 bg-neutral-50">
          <SchoolHeader />
          <div className="w-full flex-1 p-4 sm:p-5 lg:px-6 lg:py-6">
            <SchoolMobileNav />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster theme="light" position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
