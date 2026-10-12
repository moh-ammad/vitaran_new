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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getAdminBreadcrumbs } from "@/features/admin/navigation";
import { AdminBackButton } from "./admin-back-button";

export function AdminHeader() {
  const crumbs = getAdminBreadcrumbs(usePathname());

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-brand-100 bg-white/90 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1 text-brand-800" />
      <AdminBackButton />
      <Separator orientation="vertical" className="mr-2 data-vertical:h-4" />
      <Breadcrumb>
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
    </header>
  );
}
