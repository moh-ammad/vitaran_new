"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
  const visited = useRef<string[]>([]);
  const poppedState = useRef(false);
  const roots = new Set([homeHref, ...(homeHrefs ?? [])]);

  useEffect(() => {
    const onPopState = () => {
      poppedState.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const trail = visited.current;
    if (poppedState.current && trail.at(-2) === pathname) trail.pop();
    else if (trail.at(-1) !== pathname) trail.push(pathname);
    poppedState.current = false;
  }, [pathname]);

  if (roots.has(pathname)) return null;

  const parentHref = getParentHref(pathname) ?? homeHref;

  const goBack = () => {
    if (visited.current.length > 1) router.back();
    else router.push(parentHref);
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
