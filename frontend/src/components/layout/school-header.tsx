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
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";
import {
  getSchoolBreadcrumbs,
  getSchoolParentHref,
} from "@/features/school-portal/navigation";
import { PortalBackButton } from "./portal-back-button";

export function SchoolHeader() {
  const crumbs = getSchoolBreadcrumbs(usePathname());
  const { isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-brand-100 bg-white/95 px-3 backdrop-blur sm:px-4">
      {/* Mobile: menu + logo only. No back / breadcrumbs / site links. */}
      {isMobile ? (
        <>
          <SidebarTrigger
            className="size-10 shrink-0 rounded-xl border border-brand-200 bg-brand-50 text-brand-900 shadow-sm hover:bg-brand-100"
            aria-label="Open menu"
          />
          <Logo compact />
          <div className="flex-1" />
        </>
      ) : (
        <>
          <SidebarTrigger className="-ml-0.5 text-brand-800" aria-label="Open menu" />
          <PortalBackButton getParentHref={getSchoolParentHref} />
          <Separator orientation="vertical" className="data-vertical:h-4" />
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList>
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <Fragment key={crumb.href}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
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
        </>
      )}
    </header>
  );
}
