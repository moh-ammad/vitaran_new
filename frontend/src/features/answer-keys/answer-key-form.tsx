"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ExternalLink, FileText, Loader2, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PROGRAM_LABELS, TYPE_LABELS } from "@/features/schools/constants";
import type { AnswerKey } from "@/types/answer-key";
import { PROGRAMS, SCHOOL_TYPES, type SchoolType } from "@/types/school";
import { updateAnswerKeyAction, uploadAnswerKeyAction } from "./actions";
import {
  ANSWER_KEYS_PATH,
  CLASS_LEVELS,
  TEST_NUMBERS,
  answerKeyFileHref,
  formatFileSize,
} from "./constants";
import { classLabel } from "@/utils/format";
import type { AnswerKeyField, AnswerKeyFormState, AnswerKeyFormValues } from "./schema";

export type CustomizedSchoolOption = { id: string; name: string; code: string };

type Item = { value: string; label: string; hint?: string };
type FieldErrors = Partial<Record<AnswerKeyField, string[]>>;

const programItems = PROGRAMS.map((value) => ({ value, label: PROGRAM_LABELS[value] }));
const typeItems = SCHOOL_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }));
const testItems = TEST_NUMBERS.map((n) => ({ value: String(n), label: `Test ${n}` }));
const classItems = CLASS_LEVELS.map((n) => ({ value: String(n), label: classLabel(n) }));

function isChanged(initial: AnswerKeyFormValues, current: AnswerKeyFormValues) {
  const fields: (keyof AnswerKeyFormValues)[] = ["program", "type", "testNumber", "classLevel"];
  if (current.type === "CUSTOMIZED") fields.push("schoolId");
  return fields.some((field) => (initial[field] ?? "") !== (current[field] ?? ""));
}

function toFormValues(answerKey?: AnswerKey): AnswerKeyFormValues {
  if (!answerKey) return { type: "REGULAR" };
  return {
    program: answerKey.program,
    type: answerKey.type,
    schoolId: answerKey.school?.id,
    testNumber: String(answerKey.testNumber),
    classLevel: String(answerKey.classLevel),
  };
}

type AnswerKeyFormProps = {
  schools: CustomizedSchoolOption[];
  /** Present when editing. */
  answerKey?: AnswerKey;
};

export function AnswerKeyForm({ schools, answerKey }: AnswerKeyFormProps) {
  const router = useRouter();
  const action = answerKey ? updateAnswerKeyAction.bind(null, answerKey.id) : uploadAnswerKeyAction;
  const [state, formAction, pending] = useActionState<AnswerKeyFormState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state?.status !== "success") return;
    toast.success(answerKey ? "Answer key updated" : "Answer key uploaded");
    router.push(ANSWER_KEYS_PATH);
  }, [state, answerKey, router]);

  const failed = state?.status === "error" ? state : undefined;

  return (
    <form action={formAction} noValidate>
      {/* Remount after a failed save so the selects show what was submitted. */}
      <FormFields
        key={failed?.submittedAt ?? "initial"}
        schools={schools}
        answerKey={answerKey}
        values={failed?.values ?? toFormValues(answerKey)}
        errors={failed?.fieldErrors ?? {}}
        message={failed?.message}
        pending={pending}
      />
    </form>
  );
}

type FormFieldsProps = {
  schools: CustomizedSchoolOption[];
  answerKey?: AnswerKey;
  values: AnswerKeyFormValues;
  errors: FieldErrors;
  message?: string;
  pending: boolean;
};

function FormFields({ schools, answerKey, values, errors, message, pending }: FormFieldsProps) {
  const [current, setCurrent] = useState(values);
  const [hasNewFile, setHasNewFile] = useState(false);
  const type = (current.type as SchoolType) || "REGULAR";
  const track = (field: keyof AnswerKeyFormValues) => (value: string) =>
    setCurrent((prev) => ({ ...prev, [field]: value }));

  const changed = !answerKey || hasNewFile || isChanged(toFormValues(answerKey), current);

  const schoolItems = schools.map((school) => ({
    value: school.id,
    label: school.name,
    hint: school.code,
  }));

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_1px_2px_rgb(25_28_95/0.04),0_12px_32px_-16px_rgb(25_28_95/0.18)]">
      {message && (
        <div
          role="alert"
          className="flex items-center gap-2.5 border-b border-destructive/15 bg-destructive/5 px-6 py-3 text-sm font-medium text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {message}
        </div>
      )}

      <div className="divide-y divide-brand-100/70">
        <Section title="Program">
          <div className={cn("grid gap-4 sm:grid-cols-2", type === "CUSTOMIZED" && "lg:grid-cols-3")}>
            <SelectField
              name="program"
              label="Program"
              placeholder="Select a program"
              items={programItems}
              defaultValue={values.program}
              onValueChange={track("program")}
              errors={errors.program}
            />
            <SelectField
              name="type"
              label="Type"
              items={typeItems}
              defaultValue={values.type || "REGULAR"}
              onValueChange={track("type")}
              errors={errors.type}
            />
            {type === "CUSTOMIZED" && (
              <SelectField
                name="schoolId"
                label="School"
                placeholder={schools.length > 0 ? "Select a customized school" : "No customized schools yet"}
                items={schoolItems}
                defaultValue={values.schoolId}
                onValueChange={track("schoolId")}
                disabled={schools.length === 0}
                className="animate-in fade-in-0 duration-200 sm:col-span-2 lg:col-span-1"
                errors={errors.schoolId}
              />
            )}
          </div>
        </Section>

        <Section title="Test & class">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="testNumber"
              label="Test"
              placeholder="Select a test"
              items={testItems}
              defaultValue={values.testNumber}
              onValueChange={track("testNumber")}
              errors={errors.testNumber}
            />
            <SelectField
              name="classLevel"
              label="Class"
              placeholder="Select a class"
              items={classItems}
              defaultValue={values.classLevel}
              onValueChange={track("classLevel")}
              errors={errors.classLevel}
            />
          </div>
        </Section>

        <Section title="Answer key file">
          <PdfDropzone current={answerKey} errors={errors.file} onFileChange={setHasNewFile} />
        </Section>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-brand-100 bg-brand-50/40 px-6 py-3.5">
        <Link href={ANSWER_KEYS_PATH} className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
        {changed && (
          <Button
            type="submit"
            disabled={pending}
            className="h-10 rounded-lg bg-brand-900 px-5 text-white animate-in fade-in-0 zoom-in-95 duration-150 hover:bg-brand-800"
          >
            {pending ? <Loader2 className="animate-spin" /> : answerKey ? <Save /> : <Upload />}
            {pending ? "Saving…" : answerKey ? "Save changes" : "Upload answer key"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-6 py-5">
      <h2 className="mb-3.5 text-base font-bold text-neutral-950">{title}</h2>
      {children}
    </section>
  );
}

type SelectFieldProps = {
  name: string;
  label: string;
  items: Item[];
  placeholder?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  errors?: string[];
};

function SelectField({
  name,
  label,
  items,
  placeholder,
  defaultValue,
  onValueChange,
  disabled,
  className,
  errors,
}: SelectFieldProps) {
  const invalid = errors?.length ? true : undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={name} className="text-[13px] font-medium text-neutral-800">
        {label} <span className="text-brand-600">*</span>
      </label>
      <Select
        name={name}
        items={items}
        disabled={disabled}
        defaultValue={defaultValue || null}
        onValueChange={(next: string | null) => {
          if (next) onValueChange?.(next);
        }}
      >
        <SelectTrigger
          id={name}
          aria-invalid={invalid}
          className="w-full rounded-lg border-neutral-200 bg-white px-3.5 text-sm text-neutral-950 shadow-xs transition-[border-color,box-shadow] hover:border-brand-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/15 data-popup-open:border-brand-600 data-popup-open:ring-3 data-popup-open:ring-brand-600/15 data-[size=default]:h-11"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          sideOffset={6}
          className="max-h-72 rounded-xl p-1.5 shadow-[0_16px_40px_-12px_rgb(25_28_95/0.28)] ring-brand-100"
        >
          {items.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              className="rounded-lg py-2 pr-8 pl-2.5 text-neutral-800 focus:bg-brand-50 focus:text-brand-900 data-selected:bg-brand-50 data-selected:font-semibold data-selected:text-brand-900"
            >
              {item.label}
              {item.hint && <span className="ml-auto text-xs font-normal text-neutral-400">{item.hint}</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalid && <FieldError>{errors?.[0]}</FieldError>}
    </div>
  );
}

function PdfDropzone({
  current,
  errors,
  onFileChange,
}: {
  current?: AnswerKey;
  errors?: string[];
  onFileChange: (hasFile: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const invalid = Boolean(errors?.length);

  function selectFile(next: File | null) {
    setFile(next);
    onFileChange(next !== null);
  }

  function undo() {
    if (inputRef.current) inputRef.current.value = "";
    selectFile(null);
  }

  if (current) {
    return (
      <div className="space-y-2">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition-colors sm:flex-nowrap",
            file ? "border-2 border-brand-900 bg-brand-50" : "border-brand-100 bg-white",
          )}
        >
          <input
            ref={inputRef}
            id="answer-key-file"
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            aria-invalid={invalid || undefined}
            className="sr-only"
            onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 rounded-full bg-brand-900 px-2 py-px text-[10px] font-semibold tracking-wide text-white uppercase">
                    New
                  </span>
                </p>
                <p className="truncate text-xs text-neutral-600">
                  {formatFileSize(file.size)} · replaces{" "}
                  <span className="text-neutral-400 line-through">{current.fileName}</span> when you save
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label
                  htmlFor="answer-key-file"
                  className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold text-brand-800 hover:bg-white"
                >
                  Change
                </label>
                <button
                  type="button"
                  onClick={undo}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-white hover:text-neutral-950"
                >
                  <X className="size-3.5" />
                  Undo
                </button>
              </div>
            </>
          ) : (
            <>
              <FileIcon />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-950">{current.fileName}</p>
                <p className="text-xs text-neutral-500">Current file · {formatFileSize(current.fileSize)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={answerKeyFileHref(current.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
                >
                  Open
                  <ExternalLink className="size-3.5" />
                </a>
                <label
                  htmlFor="answer-key-file"
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-900 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
                >
                  <Upload className="size-3.5" />
                  Replace PDF
                </label>
              </div>
            </>
          )}
        </div>
        {invalid && <FieldError>{errors?.[0]}</FieldError>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <div className="relative">
          <label
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            className={cn(
              "relative flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
              file
                ? "border-2 border-brand-900 bg-brand-50"
                : dragging
                  ? "border-brand-700 bg-brand-700"
                  : "border-brand-900 bg-brand-900 hover:border-brand-800 hover:bg-brand-800",
              invalid && !file && "ring-3 ring-destructive/40",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept="application/pdf,.pdf"
              aria-invalid={invalid || undefined}
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pr-20">
                  <p className="truncate text-sm font-semibold text-neutral-950">{file.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <span className="rounded-full bg-brand-900 px-2 py-px text-[10px] font-semibold tracking-wide text-white uppercase">
                      Ready
                    </span>
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Upload className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Choose a PDF <span className="font-normal text-white/70">or drag it here</span>
                  </p>
                  <p className="text-xs text-white/60">PDF only · up to 10 MB</p>
                </div>
              </>
            )}
          </label>
          {file && (
            <button
              type="button"
              onClick={undo}
              className="absolute top-1/2 right-3 z-10 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-white hover:text-brand-900"
            >
              <X className="size-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
      {invalid && <FieldError>{errors?.[0]}</FieldError>}
    </div>
  );
}

function FileIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700">
      <FileText className="size-4" />
    </span>
  );
}
