"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import { capitalizeWords } from "@/features/schools/schema";
import { cn } from "@/lib/utils";
import type { LearningProgram } from "@/types/program";
import { deleteProgramAction } from "./actions";

export function ProgramsTable({ programs }: { programs: LearningProgram[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (programs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        No programs yet. Create the first catalog program.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Program</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead className="hidden md:table-cell">Subjects</TableHead>
            <TableHead className="w-28 pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id}>
              <TableCell className="pl-4">
                <p className="font-semibold text-neutral-950">{capitalizeWords(program.name)}</p>
                <p className="font-mono text-xs text-neutral-500">{program.code}</p>
              </TableCell>
              <TableCell>{program.year}</TableCell>
              <TableCell>
                {program.classFrom}–{program.classTo}
              </TableCell>
              <TableCell className="hidden max-w-72 md:table-cell">
                <span className="line-clamp-2 text-sm text-neutral-600">
                  {program.subjects.map((subject) => SUBJECT_LABELS[subject]).join(", ")}
                </span>
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/admin/programs/${program.id}/edit`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  >
                    <Pencil />
                    <span className="sr-only">Edit</span>
                  </Link>
                  <button
                    type="button"
                    disabled={pending}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-red-600")}
                    onClick={() => {
                      if (!confirm(`Delete “${program.name}”? Schools using it cannot be deleted.`)) return;
                      startTransition(async () => {
                        const result = await deleteProgramAction(program.id);
                        if (!result.ok) {
                          toast.error(result.message);
                          return;
                        }
                        toast.success("Program deleted");
                        router.refresh();
                      });
                    }}
                  >
                    <Trash2 />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
