"use client";

import { useCallback, useMemo, useState } from "react";
import { FieldError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { LearningProgram } from "@/types/program";
import { encodeOffering, parseOfferingToken } from "./offerings";
import { capitalizeWords } from "./schema";

type ProgramOfferingsFieldProps = {
  catalog: LearningProgram[];
  value: string[];
  negativeMarking: string[];
  onChange: (next: string[]) => void;
  onNegativeMarkingChange?: (next: string[]) => void;
  error?: string;
};

function classLevels(program: LearningProgram) {
  return Array.from(
    { length: program.classTo - program.classFrom + 1 },
    (_, index) => program.classFrom + index,
  );
}

export function ProgramOfferingsField({
  catalog,
  value,
  negativeMarking,
  onChange,
  onNegativeMarkingChange,
  error,
}: ProgramOfferingsFieldProps) {
  const [selectedIds, setSelectedIds] = useState(() => {
    const open = new Set<string>();
    for (const token of value) {
      const parsed = parseOfferingToken(token);
      if (parsed) open.add(parsed.programId);
    }
    return open;
  });
  const [markingIds, setMarkingIds] = useState(() => new Set(negativeMarking));

  const emit = useCallback(
    (next: string[]) => {
      queueMicrotask(() => onChange(next));
    },
    [onChange],
  );

  const emitMarking = useCallback(
    (next: Set<string>) => {
      setMarkingIds(next);
      queueMicrotask(() => onNegativeMarkingChange?.([...next]));
    },
    [onNegativeMarkingChange],
  );

  const selectedPrograms = useMemo(
    () => catalog.filter((program) => selectedIds.has(program.id)),
    [catalog, selectedIds],
  );

  const classActive = (programId: string, classLevel: number) =>
    value.some((token) => {
      const parsed = parseOfferingToken(token);
      return parsed?.programId === programId && parsed.classLevel === classLevel;
    });

  const toggleProgram = (program: LearningProgram, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(program.id);
      else next.delete(program.id);
      return next;
    });
    if (!checked) {
      emit(value.filter((token) => !token.startsWith(`${program.id}:`)));
      if (markingIds.has(program.id)) {
        const next = new Set(markingIds);
        next.delete(program.id);
        emitMarking(next);
      }
    }
  };

  const toggleClass = (program: LearningProgram, classLevel: number, checked: boolean) => {
    const withoutClass = value.filter((token) => {
      const parsed = parseOfferingToken(token);
      return !(parsed && parsed.programId === program.id && parsed.classLevel === classLevel);
    });

    if (!checked) {
      emit(withoutClass);
      return;
    }

    const subjects = program.subjects.length > 0 ? program.subjects : [];
    if (subjects.length === 0) {
      emit(withoutClass);
      return;
    }

    emit([
      ...withoutClass,
      ...subjects.map((subject) => encodeOffering(program.id, classLevel, subject)),
    ]);
  };

  const toggleMarking = (programId: string, checked: boolean) => {
    const next = new Set(markingIds);
    if (checked) next.add(programId);
    else next.delete(programId);
    emitMarking(next);
  };

  if (catalog.length === 0) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Create at least one program in Admin → Programs before enrolling a school.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
          Programs
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {catalog.map((program) => {
            const id = `offer-program-${program.id}`;
            return (
              <label key={program.id} htmlFor={id} className="flex cursor-pointer items-center gap-2">
                <input
                  id={id}
                  type="checkbox"
                  className="size-4 rounded border-neutral-300 accent-brand-800"
                  checked={selectedIds.has(program.id)}
                  onChange={(event) => toggleProgram(program, event.target.checked)}
                />
                <span className="text-sm font-medium text-neutral-900">
                  {capitalizeWords(program.name)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {selectedPrograms.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {selectedPrograms.map((program) => {
            const levels = classLevels(program);
            const markingOn = markingIds.has(program.id);
            return (
              <div
                key={program.id}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
              >
                <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                  <h4 className="truncate text-sm font-bold text-neutral-950">
                    {capitalizeWords(program.name)}
                  </h4>
                </div>
                <ul className="divide-y divide-neutral-100">
                  {levels.map((classLevel) => {
                    const id = `offer-class-${program.id}-${classLevel}`;
                    const active = classActive(program.id, classLevel);
                    return (
                      <li key={classLevel}>
                        <label
                          htmlFor={id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-2 px-3 py-2",
                            active ? "bg-brand-50/60" : "hover:bg-neutral-50",
                          )}
                        >
                          <span className="text-sm font-medium text-neutral-900">
                            Class {classLevel}
                          </span>
                          <input
                            id={id}
                            type="checkbox"
                            className="size-3.5 rounded border-neutral-300 accent-brand-800"
                            checked={active}
                            onChange={(event) =>
                              toggleClass(program, classLevel, event.target.checked)
                            }
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 border-t px-3 py-3",
                    markingOn ? "border-brand-200 bg-brand-50" : "border-neutral-200 bg-neutral-50",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-neutral-950">
                      Enable negative marking
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {markingOn ? "Wrong answers score −1" : "Wrong answers score 0"}
                    </span>
                  </span>
                  <Switch
                    checked={markingOn}
                    onCheckedChange={(checked) => toggleMarking(program.id, checked)}
                    aria-label={`Enable negative marking for ${program.name}`}
                    className="data-checked:bg-brand-900"
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}

      {selectedPrograms.length === 0 && (
        <p className="text-sm text-neutral-500">Check one or more programs to assign classes.</p>
      )}

      {value.map((token) => (
        <input key={token} type="hidden" name="offerings" value={token} />
      ))}
      {[...markingIds].map((programId) => (
        <input key={`mark-${programId}`} type="hidden" name="negativeMarking" value={programId} />
      ))}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
