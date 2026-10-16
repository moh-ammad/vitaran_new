"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { capitalizeWords } from "@/features/schools/schema";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { cn } from "@/lib/utils";
import type { Teacher } from "@/types/teacher";
import { setClassTeacherAction } from "./actions";

type ClassDetailFormProps = {
  programId: string;
  programName: string;
  classLevel: number;
  currentTeacherId: string | null;
  /** Active teachers assigned to this program + class only. */
  teachers: Teacher[];
};

export function ClassDetailForm({
  programId,
  programName,
  classLevel,
  currentTeacherId,
  teachers = [],
}: ClassDetailFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [teacherId, setTeacherId] = useState<string | null>(currentTeacherId);
  const dirty = teacherId !== currentTeacherId;
  const { formRef, markClean, guardCancelClick, dialog } = useUnsavedChanges(dirty);
  const cancelHref = "/school/classes";

  const toggleTeacher = (id: string, checked: boolean) => {
    setTeacherId(checked ? id : null);
  };

  return (
    <>
      <form
        ref={formRef}
        className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await setClassTeacherAction({
              programId,
              classLevel,
              teacherId,
            });
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            markClean();
            toast.success("Class teacher saved");
            router.push(cancelHref);
            router.refresh();
          });
        }}
      >
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
          <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">
            {capitalizeWords(programName)}
          </p>
          <h2 className="mt-1 text-xl font-bold text-neutral-950">Class {classLevel}</h2>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-neutral-950">Class teacher</h3>
          <p className="text-sm text-neutral-500">
            Teachers assigned to this program and class. Check one to make them class teacher.
          </p>

          {teachers.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              No teachers are assigned to this program and class yet. Add subject assignments on a
              teacher first.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {teachers.map((teacher) => {
                const id = `class-teacher-${teacher.id}`;
                const checked = teacherId === teacher.id;
                return (
                  <li key={teacher.id}>
                    <label
                      htmlFor={id}
                      className={cn(
                        "flex h-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5",
                        checked
                          ? "border-brand-200 bg-brand-50"
                          : "border-neutral-200 bg-white hover:border-neutral-300",
                      )}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        className="size-3.5 shrink-0 rounded border-neutral-300 accent-brand-800"
                        checked={checked}
                        onChange={(event) => toggleTeacher(teacher.id, event.target.checked)}
                      />
                      <span className="truncate text-sm font-bold tracking-tight text-neutral-950">
                        {capitalizeWords(teacher.name)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-4">
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: "ghost" })}
            onClick={guardCancelClick(cancelHref)}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Save changes
          </Button>
        </footer>
      </form>
      {dialog}
    </>
  );
}
