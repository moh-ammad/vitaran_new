"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowLeft, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type PortalMobileNavProps = {
  getParentHref: (pathname: string) => string | null;
};

/**
 * Mobile-only page chrome: back arrow + Home / Solutions.
 * Keeps the header clean (logo + menu) while nested pages stay easy to leave.
 */
export function PortalMobileNav({ getParentHref }: PortalMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const visited = useRef<string[]>([]);
  const poppedState = useRef(false);
  const parentHref = getParentHref(pathname);

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

  const goBack = () => {
    if (!parentHref) return;
    if (visited.current.length > 1) router.back();
    else router.push(parentHref);
  };

  return (
    <div className="mb-4 space-y-2 md:hidden">
      {parentHref && (
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          className="h-10 w-full justify-start gap-2 border-neutral-200 bg-white font-semibold text-brand-900 shadow-sm"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      )}

      <nav aria-label="Site" className="grid grid-cols-2 gap-2">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-neutral-950 shadow-sm"
        >
          <Home className="size-4 text-brand-800" />
          Home
        </Link>
        <Link
          href="/#services"
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-neutral-950 shadow-sm"
        >
          <Sparkles className="size-4 text-brand-800" />
          Solutions
        </Link>
      </nav>
    </div>
  );
}
