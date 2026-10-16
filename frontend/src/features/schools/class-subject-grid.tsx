"use client";

import { SUBJECT_LABELS } from "@/features/schools/constants";
import type { Subject } from "@/types/school";
import { cn } from "@/lib/utils";

export type ClassSubjectColumn = {
  classLevel: number;
  subjects: Subject[];
};

type ClassSubjectGridProps = {
  columns: ClassSubjectColumn[];
  isSubjectChecked: (classLevel: number, subject: Subject) => boolean;
  onToggleSubject: (classLevel: number, subject: Subject, checked: boolean) => void;
  idPrefix: string;
  /** When a class has subjects checked and the slot is free (or ours), show class-teacher toggle. */
  classTeacherToggle?: {
    isVisible: (classLevel: number) => boolean;
    isChecked: (classLevel: number) => boolean;
    onToggle: (classLevel: number, checked: boolean) => void;
  };
};

export function ClassSubjectGrid({
  columns,
  isSubjectChecked,
  onToggleSubject,
  idPrefix,
  classTeacherToggle,
}: ClassSubjectGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {columns.map(({ classLevel, subjects }) => {
        const active = subjects.some((subject) => isSubjectChecked(classLevel, subject));
        const showToggle = !!classTeacherToggle?.isVisible(classLevel);

        return (
          <div
            key={classLevel}
            className={cn(
              "rounded-xl border bg-white p-3 shadow-sm",
              active ? "border-brand-200" : "border-neutral-200",
            )}
          >
            <p className="text-sm font-semibold text-neutral-950">Class {classLevel}</p>
            <ul className="mt-3 space-y-1.5 border-t border-neutral-100 pt-2">
              {subjects.map((subject) => {
                const subjectId = `${idPrefix}-c${classLevel}-${subject}`;
                return (
                  <li key={subject}>
                    <label htmlFor={subjectId} className="flex cursor-pointer items-center gap-2">
                      <input
                        id={subjectId}
                        type="checkbox"
                        className="size-3.5 rounded border-neutral-300 accent-brand-800"
                        checked={isSubjectChecked(classLevel, subject)}
                        onChange={(event) =>
                          onToggleSubject(classLevel, subject, event.target.checked)
                        }
                      />
                      <span className="text-xs font-medium text-neutral-700">
                        {SUBJECT_LABELS[subject]}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {showToggle && classTeacherToggle && (
              <label
                htmlFor={`${idPrefix}-ct-${classLevel}`}
                className="mt-3 flex cursor-pointer items-center justify-between gap-2 border-t border-brand-100 pt-2"
              >
                <span className="text-xs font-semibold text-brand-900">Class teacher</span>
                <input
                  id={`${idPrefix}-ct-${classLevel}`}
                  type="checkbox"
                  className="size-3.5 rounded border-neutral-300 accent-brand-800"
                  checked={classTeacherToggle.isChecked(classLevel)}
                  onChange={(event) => classTeacherToggle.onToggle(classLevel, event.target.checked)}
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
