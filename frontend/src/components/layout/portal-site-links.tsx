"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const linkClass =
  "rounded-md px-2 py-1 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50 hover:text-brand-950";

/** Public site shortcuts shown in school & teacher portal headers. */
export function PortalSiteLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Site" className={cn("flex items-center gap-0.5", className)}>
      <Link href="/" className={linkClass}>
        Home
      </Link>
      <Link href="/#services" className={linkClass}>
        Solutions
      </Link>
    </nav>
  );
}
