import { cookies } from "next/headers";
import { Suspense } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminPageBack } from "@/components/layout/admin-page-back";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { InPageBackProvider } from "@/components/layout/in-page-back";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PanelFallback } from "@/features/admin/dashboard-parts";
import { verifyAdminSession } from "@/features/admin-auth/session";

const SIDEBAR_STATE_COOKIE = "sidebar_state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
            <div className="w-full min-w-0 flex-1 px-3 py-4 sm:px-4 lg:px-4 lg:py-5">
              <AdminPageBack />
              <Suspense fallback={<PanelFallback />}>{children}</Suspense>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </InPageBackProvider>
      <Toaster theme="light" position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
