"use client";

import { getStudentParentHref } from "@/features/student-portal/navigation";
import { PortalPageBack } from "./portal-page-back";

export function StudentPageBack() {
  return <PortalPageBack getParentHref={getStudentParentHref} homeHref="/student" />;
}
