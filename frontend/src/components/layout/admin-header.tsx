"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAdminBreadcrumbs } from "@/features/admin/navigation";

export function AdminHeader() {
  const crumbs = getAdminBreadcrumbs(usePathname());
  const isMobile = useIsMobile();
  const dashboardOnly = crumbs.length <= 1;

  // Desktop dashboard: no breadcrumb bar (avoids repeating "Dashboard").
  if (!isMobile && dashboardOnly) return null;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-brand-100 bg-white/90 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1 text-brand-800" />
      {!dashboardOnly && (
        <Breadcrumb className={isMobile ? "sr-only" : "min-w-0 flex-1"}>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <Fragment key={crumb.href}>
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem className={last ? undefined : "hidden md:inline-flex"}>
                    {last ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </header>
  );
}
