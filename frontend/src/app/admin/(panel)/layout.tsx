import { cookies } from "next/headers";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminPageBack } from "@/components/layout/admin-page-back";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { InPageBackProvider } from "@/components/layout/in-page-back";
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
      <InPageBackProvider>
        <SidebarProvider
          defaultOpen={defaultOpen}
          style={{ "--sidebar-width": "10.8rem" } as React.CSSProperties}
        >
          <AdminSidebar admin={admin} />
          <SidebarInset className="min-w-0 bg-neutral-50">
            <AdminHeader />
            <div className="w-full flex-1 p-4 sm:p-5 lg:px-6 lg:py-6">
              <AdminPageBack />
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </InPageBackProvider>
      <Toaster theme="light" position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
