"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassSubjectGrid } from "@/features/schools/class-subject-grid";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { SchoolProgramOffering } from "@/types/program";
import type { Subject } from "@/types/school";
import type { ClassTeacherSlot, TeacherDetail } from "@/types/teacher";
import { TEACHER_STATUS_LABELS } from "./constants";
import type { TeacherFormState, TeacherFormValues } from "./actions";

type TeacherFormProps = {
  teacher?: TeacherDetail;
  schoolPrograms: SchoolProgramOffering[];
  /** Existing class-teacher slots for the school. */
  classTeacherSlots: ClassTeacherSlot[];
  /** Slots this teacher already owns (edit only). */
  myClassTeacherSlots?: { programId: string; classLevel: number }[];
  action: (state: TeacherFormState, formData: FormData) => Promise<TeacherFormState>;
  cancelHref: string;
  successHref: string;
};

function encodeAssignment(programId: string, classLevel: number, subject: Subject) {
  return `${programId}:${classLevel}:${subject}`;
}

function encodeSlot(programId: string, classLevel: number) {
  return `${programId}:${classLevel}`;
}

function toValues(
  teacher?: TeacherDetail,
  mySlots: { programId: string; classLevel: number }[] = [],
): TeacherFormValues {
  return {
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    phone: teacher?.phone ?? "",
    status: teacher?.status ?? "ACTIVE",
    password: teacher?.password ?? "",
    assignments:
      teacher?.assignments.map((item) =>
        encodeAssignment(item.programId, item.classLevel, item.subject),
      ) ?? [],
    classTeacherFor: mySlots.map((slot) => encodeSlot(slot.programId, slot.classLevel)),
  };
}

export function TeacherForm({
  teacher,
  schoolPrograms,
  classTeacherSlots,
  myClassTeacherSlots = [],
  action,
  cancelHref,
  successHref,
}: TeacherFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, undefined);
  const [values] = useState(() =>
    state?.status === "error" ? state.values : toValues(teacher, myClassTeacherSlots),
  );
  const [assignments, setAssignments] = useState(values.assignments);
  const [classTeacherFor, setClassTeacherFor] = useState(values.classTeacherFor);
  const [selectedIds, setSelectedIds] = useState(() => {
    const ids = new Set<string>();
    for (const token of values.assignments) {
      const programId = token.split(":")[0];
      if (programId) ids.add(programId);
    }
    if (ids.size === 0 && schoolPrograms[0]) ids.add(schoolPrograms[0].programId);
    return ids;
  });
  const [baseline] = useState(() => ({
    assignments: values.assignments.slice().sort().join("|"),
    classTeacherFor: values.classTeacherFor.slice().sort().join("|"),
    name: values.name,
    email: values.email,
    phone: values.phone,
    status: values.status,
    password: values.password,
  }));
  const [profileDirty, setProfileDirty] = useState(false);
  const isEdit = !!teacher;
  const dirty =
    profileDirty ||
    assignments.slice().sort().join("|") !== baseline.assignments ||
    classTeacherFor.slice().sort().join("|") !== baseline.classTeacherFor;

  const { formRef, markClean, guardCancelClick, dialog } = useUnsavedChanges(isEdit && dirty);
  const errors = state?.status === "error" ? state.fieldErrors : undefined;

  const occupiedByOther = useMemo(() => {
    const map = new Map<string, ClassTeacherSlot>();
    for (const slot of classTeacherSlots) {
      if (teacher && slot.teacherId === teacher.id) continue;
      map.set(encodeSlot(slot.programId, slot.classLevel), slot);
    }
    return map;
  }, [classTeacherSlots, teacher]);

  const selectedPrograms = useMemo(
    () => schoolPrograms.filter((row) => selectedIds.has(row.programId)),
    [schoolPrograms, selectedIds],
  );

  useEffect(() => {
    if (state?.status === "success") {
      markClean();
      toast.success(isEdit ? "Teacher updated" : "Teacher created");
      router.replace(successHref.replaceAll("{id}", state.teacherId));
    } else if (state?.status === "error" && state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, isEdit, router, successHref, markClean]);

  const setToken = (programId: string, classLevel: number, subject: Subject, checked: boolean) => {
    const token = encodeAssignment(programId, classLevel, subject);
    setAssignments((prev) => {
      const next = checked
        ? [...prev.filter((item) => item !== token), token]
        : prev.filter((item) => item !== token);
      const stillHasClass = next.some((item) => item.startsWith(`${programId}:${classLevel}:`));
      if (!stillHasClass) {
        setClassTeacherFor((slots) =>
          slots.filter((slot) => slot !== encodeSlot(programId, classLevel)),
        );
      }
      return next;
    });
  };

  if (schoolPrograms.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Enrol this school in at least one program with classes before creating teachers.
      </div>
    );
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-8"
        onChange={() => {
          if (isEdit) setProfileDirty(true);
        }}
      >
        {assignments.map((value) => (
          <input key={value} type="hidden" name="assignments" value={value} />
        ))}
        {classTeacherFor.map((value) => (
          <input key={value} type="hidden" name="classTeacherFor" value={value} />
        ))}

        <div className="grid gap-4 md:grid-cols-2">
          <Field data-invalid={errors?.name ? true : undefined}>
            <FieldLabel htmlFor="name">Full name *</FieldLabel>
            <Input id="name" name="name" defaultValue={values.name} required />
            {errors?.name && <FieldError>{errors.name[0]}</FieldError>}
          </Field>
          <Field data-invalid={errors?.status ? true : undefined}>
            <FieldLabel htmlFor="status">Status *</FieldLabel>
            <Select
              name="status"
              items={Object.entries(TEACHER_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              defaultValue={values.status}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEACHER_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field data-invalid={errors?.email ? true : undefined}>
            <FieldLabel htmlFor="email">Email *</FieldLabel>
            <Input id="email" name="email" type="email" defaultValue={values.email} required />
            {errors?.email && <FieldError>{errors.email[0]}</FieldError>}
          </Field>
          <Field data-invalid={errors?.phone ? true : undefined}>
            <FieldLabel htmlFor="phone">Phone *</FieldLabel>
            <Input
              id="phone"
              name="phone"
              inputMode="numeric"
              maxLength={10}
              defaultValue={values.phone}
              required
            />
            {errors?.phone && <FieldError>{errors.phone[0]}</FieldError>}
          </Field>
          <Field data-invalid={errors?.password ? true : undefined} className="md:col-span-2">
            <FieldLabel htmlFor="password">{isEdit ? "Password" : "Password *"}</FieldLabel>
            <Input
              id="password"
              name="password"
              type="text"
              defaultValue={values.password}
              autoComplete="off"
              spellCheck={false}
              placeholder={isEdit ? "Leave blank to keep current password" : undefined}
            />
            {errors?.password && <FieldError>{errors.password[0]}</FieldError>}
          </Field>
        </div>

        <section className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-neutral-950">Programs & classes *</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Check subjects per class. A class-teacher toggle appears when that class has no class
              teacher yet.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {schoolPrograms.map((row) => {
              const id = `teacher-program-${row.programId}`;
              return (
                <label
                  key={row.programId}
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    id={id}
                    type="checkbox"
                    className="size-4 rounded border-neutral-300 accent-brand-800"
                    checked={selectedIds.has(row.programId)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(row.programId);
                        else next.delete(row.programId);
                        return next;
                      });
                      if (!checked) {
                        setAssignments((prev) =>
                          prev.filter((token) => !token.startsWith(`${row.programId}:`)),
                        );
                        setClassTeacherFor((prev) =>
                          prev.filter((slot) => !slot.startsWith(`${row.programId}:`)),
                        );
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-neutral-900">{row.programName}</span>
                </label>
              );
            })}
          </div>

          {selectedPrograms.map((offering) => (
            <div key={offering.programId} className="space-y-3">
              <h4 className="border-b border-neutral-200 pb-2 text-sm font-bold text-neutral-950">
                {offering.programName}
              </h4>
              <ClassSubjectGrid
                idPrefix={`teacher-${offering.programId}`}
                columns={offering.classes.map((row) => ({
                  classLevel: row.classLevel,
                  subjects: row.subjects,
                }))}
                isSubjectChecked={(classLevel, subject) =>
                  assignments.includes(encodeAssignment(offering.programId, classLevel, subject))
                }
                onToggleSubject={(classLevel, subject, checked) =>
                  setToken(offering.programId, classLevel, subject, checked)
                }
                classTeacherToggle={{
                  isVisible: (classLevel) => {
                    const hasSubject = assignments.some((token) =>
                      token.startsWith(`${offering.programId}:${classLevel}:`),
                    );
                    if (!hasSubject) return false;
                    return !occupiedByOther.has(encodeSlot(offering.programId, classLevel));
                  },
                  isChecked: (classLevel) =>
                    classTeacherFor.includes(encodeSlot(offering.programId, classLevel)),
                  onToggle: (classLevel, checked) => {
                    const key = encodeSlot(offering.programId, classLevel);
                    setClassTeacherFor((prev) =>
                      checked ? [...prev.filter((item) => item !== key), key] : prev.filter((item) => item !== key),
                    );
                  },
                }}
              />
            </div>
          ))}

          {errors?.assignments && <FieldError>{errors.assignments[0]}</FieldError>}
        </section>

        <footer className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-4">
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: "ghost" })}
            onClick={isEdit ? guardCancelClick(cancelHref) : undefined}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={pending || assignments.length === 0}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            {isEdit ? "Save changes" : "Create teacher"}
          </Button>
        </footer>
      </form>
      {dialog}
    </>
  );
}
