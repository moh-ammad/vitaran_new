"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DeleteSchoolDialog } from "./delete-school-dialog";

type SchoolDetailActionsProps = {
  school: { id: string; name: string };
  /** For dark surfaces. */
  inverted?: boolean;
};

// Standalone classes: `cn` doesn't merge Tailwind conflicts, so variant colours can't be overridden.
const INVERTED_BASE =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-white/40 [&_svg]:size-4 [&_svg]:shrink-0";
const INVERTED_OUTLINE = `${INVERTED_BASE} border border-white/25 bg-transparent text-white hover:bg-white/10`;
const INVERTED_SOLID = `${INVERTED_BASE} border border-white bg-white text-neutral-950 hover:bg-neutral-200`;

export function SchoolDetailActions({ school, inverted = false }: SchoolDetailActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const editHref = `/admin/schools/${school.id}/edit`;

  return (
    <>
      {inverted ? (
        <>
          <button type="button" onClick={() => setConfirmOpen(true)} className={INVERTED_OUTLINE}>
            <Trash2 />
            Delete
          </button>
          <Link href={editHref} className={INVERTED_SOLID}>
            <Pencil />
            Edit school
          </Link>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            <Trash2 />
            Delete
          </Button>
          <Link href={editHref} className={buttonVariants()}>
            <Pencil />
            Edit school
          </Link>
        </>
      )}
      <DeleteSchoolDialog
        school={school}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        redirectTo="/admin/schools"
      />
    </>
  );
}
