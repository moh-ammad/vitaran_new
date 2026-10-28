"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconRowActions } from "@/components/shared/icon-row-actions";
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
import type { LearningProgram } from "@/types/program";
import { deleteProgramAction } from "./actions";

export function ProgramsTable({ programs }: { programs: LearningProgram[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (programs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center">
        <p className="text-sm font-semibold text-neutral-950">No programs yet</p>
        <p className="mt-1 text-sm text-neutral-500">
          Create the first catalog program schools can enrol in.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_12px_32px_-20px_rgb(25_28_95/0.35)]">
      <Table>
        <TableHeader>
          <TableRow className="border-brand-100 bg-brand-50/60 hover:bg-brand-50/60">
            <TableHead className="pl-5 text-[11px] font-semibold tracking-wider text-brand-700 uppercase">
              Program
            </TableHead>
            <TableHead className="text-[11px] font-semibold tracking-wider text-brand-700 uppercase">
              Year
            </TableHead>
            <TableHead className="text-[11px] font-semibold tracking-wider text-brand-700 uppercase">
              Classes
            </TableHead>
            <TableHead className="hidden text-[11px] font-semibold tracking-wider text-brand-700 uppercase md:table-cell">
              Subjects
            </TableHead>
            <TableHead className="w-32 pr-5 text-right text-[11px] font-semibold tracking-wider text-brand-700 uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id} className="border-brand-100/70 hover:bg-brand-50/40">
              <TableCell className="py-3.5 pl-5">
                <Link href={`/admin/programs/${program.id}`} className="group block min-w-0">
                  <p className="font-semibold text-neutral-950 group-hover:text-brand-800 group-hover:underline">
                    {capitalizeWords(program.name)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-neutral-500">{program.code}</p>
                </Link>
              </TableCell>
              <TableCell className="tabular-nums text-neutral-800">{program.year}</TableCell>
              <TableCell className="tabular-nums text-neutral-800">
                {program.classFrom}–{program.classTo}
              </TableCell>
              <TableCell className="hidden max-w-72 md:table-cell">
                <span className="line-clamp-2 text-sm text-neutral-600">
                  {program.subjects.map((subject) => SUBJECT_LABELS[subject]).join(", ")}
                </span>
              </TableCell>
              <TableCell className="pr-5 text-right">
                <IconRowActions
                  viewHref={`/admin/programs/${program.id}`}
                  editHref={`/admin/programs/${program.id}/edit`}
                  label={program.name}
                  deleteDisabled={pending}
                  onDelete={() => {
                    if (
                      !confirm(
                        `Delete “${program.name}”? This unenrolls schools and removes related classes, assignments, students, answer keys, and results for this program.`,
                      )
                    ) {
                      return;
                    }
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
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
