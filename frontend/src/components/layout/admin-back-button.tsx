"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAdminParentHref } from "@/features/admin/navigation";

/**
 * Goes to the previous admin page the user actually visited (keeping its query,
 * e.g. the form step), or to the parent route when there is no in-app history
 * such as after a reload or when opened from a link.
 */
export function AdminBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const visited = useRef<string[]>([]);
  const poppedState = useRef(false);

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

  const parentHref = getAdminParentHref(pathname);
  if (!parentHref) return null;

  const goBack = () => {
    if (visited.current.length > 1) router.back();
    else router.push(parentHref);
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={goBack}
            aria-label="Go back"
            className="text-brand-800"
          />
        }
      >
        <ArrowLeft />
      </TooltipTrigger>
      <TooltipContent>Back</TooltipContent>
    </Tooltip>
  );
}
