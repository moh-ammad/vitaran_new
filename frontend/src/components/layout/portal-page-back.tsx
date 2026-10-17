"use client";

import { usePathname } from "next/navigation";
import { PortalBackButton } from "./portal-back-button";

/** On-page back — never in the header. */
export function PortalPageBack({
  getParentHref,
  homeHref,
  homeHrefs,
}: {
  getParentHref: (pathname: string) => string | null;
  homeHref: string;
  homeHrefs?: string[];
}) {
  const pathname = usePathname();
  const roots = new Set([homeHref, ...(homeHrefs ?? [])]);
  if (roots.has(pathname)) return null;

  return (
    <div className="mb-2 md:mb-3">
      <PortalBackButton
        getParentHref={getParentHref}
        homeHref={homeHref}
        homeHrefs={homeHrefs}
      />
    </div>
  );
}
