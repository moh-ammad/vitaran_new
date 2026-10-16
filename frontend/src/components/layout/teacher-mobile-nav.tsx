"use client";

import { getTeacherParentHref } from "@/features/teacher-portal/navigation";
import { PortalMobileNav } from "./portal-mobile-nav";

export function TeacherMobileNav() {
  return <PortalMobileNav getParentHref={getTeacherParentHref} />;
}
