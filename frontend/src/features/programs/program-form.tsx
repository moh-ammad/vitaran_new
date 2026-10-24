"use client";

import { useActionState, useEffect, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SUBJECTS } from "@/types/school";
import type { LearningProgram } from "@/types/program";
import type { ProgramFormState, ProgramFormValues } from "./actions";

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() - 1 + index));

type ProgramFormProps = {
  program?: LearningProgram;
  action: (state: ProgramFormState, formData: FormData) => Promise<ProgramFormState>;
};

function toValues(program?: LearningProgram): ProgramFormValues {
  return {
    name: program?.name ?? "",
    year: String(program?.year ?? new Date().getFullYear()),
    classFrom: String(program?.classFrom ?? 1),
    classTo: String(program?.classTo ?? 10),
    subjects: program?.subjects ?? [],
    code: program?.code ?? "",
  };
}

export function ProgramForm({ program, action }: ProgramFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, undefined);
  const values = state?.status === "error" ? state.values : toValues(program);
  const [subjects, setSubjects] = useState(values.subjects);
  const [dirty, setDirty] = useState(false);
  const errors = state?.status === "error" ? state.fieldErrors : undefined;
  const isEdit = !!program;
  const cancelHref = "/admin/programs";
  const { formRef, markClean, guardCancelClick, dialog } = useUnsavedChanges(isEdit && dirty);

  useEffect(() => {
    if (state?.status === "success") {
      markClean();
      toast.success(isEdit ? "Program updated" : "Program created");
      router.replace(cancelHref);
    } else if (state?.status === "error" && state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, isEdit, router, markClean]);

  return (
    <>
    <Form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-8"
      onChange={() => {
        if (isEdit) setDirty(true);
      }}
    >
      {subjects.map((subject) => (
        <input key={subject} type="hidden" name="subjects" value={subject} />
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        <Field data-invalid={errors?.name ? true : undefined} className="md:col-span-2">
          <FieldLabel htmlFor="name">Program name *</FieldLabel>
          <Input id="name" name="name" defaultValue={values.name} required />
          {errors?.name && <FieldError>{errors.name[0]}</FieldError>}
        </Field>

        <Field data-invalid={errors?.year ? true : undefined}>
          <FieldLabel htmlFor="year">Year *</FieldLabel>
          <Select name="year" items={YEAR_OPTIONS.map((value) => ({ value, label: value }))} defaultValue={values.year}>
            <SelectTrigger id="year" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.year && <FieldError>{errors.year[0]}</FieldError>}
        </Field>

        {isEdit ? (
          <Field>
            <FieldLabel htmlFor="code">Code</FieldLabel>
            <Input id="code" name="code" defaultValue={values.code} readOnly className="bg-neutral-50" />
          </Field>
        ) : (
          <Field data-invalid={errors?.code ? true : undefined}>
            <FieldLabel htmlFor="code">Code (optional)</FieldLabel>
            <Input
              id="code"
              name="code"
              defaultValue={values.code}
              placeholder="Auto-generated from name"
              autoCapitalize="characters"
            />
            {errors?.code && <FieldError>{errors.code[0]}</FieldError>}
          </Field>
        )}

        <Field data-invalid={errors?.classFrom ? true : undefined}>
          <FieldLabel htmlFor="classFrom">Class from *</FieldLabel>
          <Select
            name="classFrom"
            items={CLASS_OPTIONS.map((value) => ({ value, label: `Class ${value}` }))}
            defaultValue={values.classFrom}
          >
            <SelectTrigger id="classFrom" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASS_OPTIONS.map((level) => (
                <SelectItem key={level} value={level}>
                  Class {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.classFrom && <FieldError>{errors.classFrom[0]}</FieldError>}
        </Field>

        <Field data-invalid={errors?.classTo ? true : undefined}>
          <FieldLabel htmlFor="classTo">Class to *</FieldLabel>
          <Select
            name="classTo"
            items={CLASS_OPTIONS.map((value) => ({ value, label: `Class ${value}` }))}
            defaultValue={values.classTo}
          >
            <SelectTrigger id="classTo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASS_OPTIONS.map((level) => (
                <SelectItem key={level} value={level}>
                  Class {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.classTo && <FieldError>{errors.classTo[0]}</FieldError>}
        </Field>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Subjects *</h3>
          <p className="mt-1 text-sm text-neutral-500">Schools can only enrol classes in these subjects.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((subject) => (
            <FieldLabel key={subject} htmlFor={`subject-${subject}`}>
              <Field orientation="horizontal" className="py-1">
                <Checkbox
                  id={`subject-${subject}`}
                  checked={subjects.includes(subject)}
                  onCheckedChange={(checked) => {
                    if (isEdit) setDirty(true);
                    setSubjects((prev) =>
                      checked === true ? [...prev, subject] : prev.filter((item) => item !== subject),
                    );
                  }}
                />
                <FieldContent>
                  <span className="text-sm font-medium">{SUBJECT_LABELS[subject]}</span>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </div>
        {errors?.subjects && <FieldError>{errors.subjects[0]}</FieldError>}
      </section>

      <footer className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-4">
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "ghost" })}
          onClick={isEdit ? guardCancelClick(cancelHref) : undefined}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending || subjects.length === 0}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          {isEdit ? "Save changes" : "Create program"}
        </Button>
      </footer>
    </Form>
    {dialog}
    </>
  );
}
