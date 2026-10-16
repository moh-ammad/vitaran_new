"use client";

import { getAdminParentHref } from "@/features/admin/navigation";
import { PortalBackButton } from "./portal-back-button";

export function AdminBackButton() {
  return <PortalBackButton getParentHref={getAdminParentHref} />;
}
