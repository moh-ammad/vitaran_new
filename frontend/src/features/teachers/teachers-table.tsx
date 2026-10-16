"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import { cn } from "@/lib/utils";
import type { Teacher, TeacherStatus } from "@/types/teacher";
import { TEACHER_STATUS_LABELS } from "./constants";

type TeachersTableProps = {
  teachers: Teacher[];
  /** Base path only, e.g. `/admin/teachers` → links to `${editHrefBase}/${id}/edit`. */
  editHrefBase: string;
  onToggleStatus: (id: string, status: TeacherStatus) => Promise<{ ok: boolean; message?: string }>;
  showSchool?: boolean;
};

export function TeachersTable({
  teachers,
  editHrefBase,
  onToggleStatus,
  showSchool,
}: TeachersTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (teachers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        No teachers yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-neutral-50/80">
          <TableRow>
            <TableHead>Teacher</TableHead>
            {showSchool && <TableHead>School</TableHead>}
            <TableHead className="hidden md:table-cell">Assignments</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => {
            const active = teacher.status === "ACTIVE";
            return (
              <TableRow key={teacher.id}>
                <TableCell>
                  <p className="font-semibold text-neutral-950">{teacher.name}</p>
                  <p className="text-xs text-neutral-500">{teacher.email}</p>
                </TableCell>
                {showSchool && (
                  <TableCell className="text-sm text-neutral-700">{teacher.school.name}</TableCell>
                )}
                <TableCell className="hidden max-w-sm md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {teacher.assignments.slice(0, 4).map((item) => (
                      <span
                        key={`${item.programId}-${item.classLevel}-${item.subject}`}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                      >
                        C{item.classLevel} · {SUBJECT_LABELS[item.subject]}
                      </span>
                    ))}
                    {teacher.assignments.length > 4 && (
                      <span className="text-[11px] text-neutral-500">
                        +{teacher.assignments.length - 4} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={active}
                      disabled={pending}
                      onCheckedChange={(checked) => {
                        startTransition(async () => {
                          const next = checked ? "ACTIVE" : "INACTIVE";
                          const result = await onToggleStatus(teacher.id, next);
                          if (!result.ok) {
                            toast.error(result.message ?? "Update failed");
                            return;
                          }
                          toast.success(
                            `${teacher.name} is now ${TEACHER_STATUS_LABELS[next].toLowerCase()}`,
                          );
                          router.refresh();
                        });
                      }}
                    />
                    <span className="text-xs font-medium text-neutral-600">
                      {TEACHER_STATUS_LABELS[teacher.status]}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`${editHrefBase}/${teacher.id}/edit`}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
