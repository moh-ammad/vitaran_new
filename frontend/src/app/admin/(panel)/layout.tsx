import { cookies } from "next/headers";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { verifyAdminSession } from "@/features/admin-auth/session";

const SIDEBAR_STATE_COOKIE = "sidebar_state";

export default async function AdminPanelLayout({
  children,
}: LayoutProps<"/admin">) {
  const [admin, cookieStore] = await Promise.all([
    verifyAdminSession(),
    cookies(),
  ]);
  const defaultOpen = cookieStore.get(SIDEBAR_STATE_COOKIE)?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={{ "--sidebar-width": "12rem" } as React.CSSProperties}
      >
        <AdminSidebar admin={admin} />
        <SidebarInset className="min-w-0 bg-neutral-50">
          <AdminHeader />
          <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-5 lg:px-8 lg:py-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster theme="light" position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
