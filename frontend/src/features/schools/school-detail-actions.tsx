"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DeleteSchoolDialog } from "./delete-school-dialog";

export function SchoolDetailActions({ school }: { school: { id: string; name: string } }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setConfirmOpen(true)}>
        <Trash2 />
        Delete
      </Button>
      <Link href={`/admin/schools/${school.id}/edit`} className={buttonVariants()}>
        <Pencil />
        Edit school
      </Link>
      <DeleteSchoolDialog
        school={school}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        redirectTo="/admin/schools"
      />
    </>
  );
}
