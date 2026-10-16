"use client";

import { getSchoolParentHref } from "@/features/school-portal/navigation";
import { PortalMobileNav } from "./portal-mobile-nav";

export function SchoolMobileNav() {
  return <PortalMobileNav getParentHref={getSchoolParentHref} />;
}
