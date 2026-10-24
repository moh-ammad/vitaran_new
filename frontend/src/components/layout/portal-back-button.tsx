"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useInPageBackHandler } from "@/components/layout/in-page-back";

type PortalBackButtonProps = {
  getParentHref: (pathname: string) => string | null;
  homeHref: string;
  homeHrefs?: string[];
};

/** Plain ← Back — no tooltip, no button background. Same everywhere. */
export function PortalBackButton({
  getParentHref,
  homeHref,
  homeHrefs,
}: PortalBackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const inPageBack = useInPageBackHandler();
  const roots = new Set([homeHref, ...(homeHrefs ?? [])]);

  // Nested in-page views (e.g. classes roster) still show Back even on a nav root URL.
  if (roots.has(pathname) && !inPageBack) return null;

  const parentHref = getParentHref(pathname) ?? homeHref;

  const goBack = () => {
    if (inPageBack) {
      inPageBack();
      return;
    }
    router.push(parentHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-900 hover:opacity-70 active:opacity-60"
    >
      <ArrowLeft className="size-4" strokeWidth={2.25} />
      Back
    </button>
  );
}
