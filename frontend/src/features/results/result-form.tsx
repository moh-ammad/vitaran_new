"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CLASS_LEVELS, hasChanges, testItems } from "@/features/documents/constants";
import { DocumentFormShell } from "@/features/documents/document-form-shell";
import { SelectField } from "@/features/documents/select-field";
import { PROGRAM_LABELS } from "@/features/schools/constants";
import { SchoolTypeBadge } from "@/features/schools/school-type-badge";
import type { ResultSchoolOption, ResultSet } from "@/types/result";
import type { Program } from "@/types/school";
import { updateResultAction, uploadResultAction } from "./actions";
import { ClassFileRow } from "./class-file-row";
import { classFileField, RESULTS_PATH } from "./constants";
import type { ResultFormState, ResultFormValues } from "./schema";

type FieldErrors = NonNullable<Exclude<ResultFormState, undefined | { status: "success" }>["fieldErrors"]>;

const TRACKED_FIELDS = ["schoolId", "program", "programName", "testNumber"] as const;

/** Classes 1–6 and 7–12, side by side. */
const CLASS_GROUPS = [CLASS_LEVELS.slice(0, 6), CLASS_LEVELS.slice(6)];

/** Regular schools with a single program get it picked for them. */
const onlyProgram = (school?: ResultSchoolOption) =>
  school?.type === "REGULAR" && school.programs.length === 1 ? school.programs[0] : undefined;

function toFormValues(resultSet?: ResultSet, school?: ResultSchoolOption): ResultFormValues {
  if (!resultSet) return { schoolId: school?.id, program: onlyProgram(school) };
  return {
    schoolId: resultSet.school.id,
    program: resultSet.program ?? undefined,
    programName: resultSet.programName ?? undefined,
    testNumber: String(resultSet.testNumber),
  };
}

const parseLevels = (value?: string) =>
  new Set((value ?? "").split(",").filter(Boolean).map(Number));

function toggle(set: Set<number>, level: number, on: boolean) {
  const next = new Set(set);
  if (on) next.add(level);
  else next.delete(level);
  return next;
}

type ResultFormProps = {
  schools: ResultSchoolOption[];
  /** Present when editing. */
  resultSet?: ResultSet;
  /** Pre-selects the school when uploading from its page. */
  defaultSchoolId?: string;
  /** Where Cancel and a successful save go. */
  backHref?: string;
};

export function ResultForm({ schools, resultSet, defaultSchoolId, backHref = RESULTS_PATH }: ResultFormProps) {
  const router = useRouter();
  const action = resultSet ? updateResultAction.bind(null, resultSet.id) : uploadResultAction;
  const [state, formAction, pending] = useActionState<ResultFormState, FormData>(action, undefined);

  useEffect(() => {
    if (state?.status !== "success") return;
    toast.success(resultSet ? "Results updated" : "Results uploaded");
    router.push(backHref);
  }, [state, resultSet, router, backHref]);

  const failed = state?.status === "error" ? state : undefined;
  const defaultSchool = schools.find(({ id }) => id === defaultSchoolId);

  return (
    <form action={formAction} noValidate>
      {/* Remount after a failed save so the fields show what was submitted. */}
      <FormFields
        key={failed?.submittedAt ?? "initial"}
        schools={schools}
        resultSet={resultSet}
        backHref={backHref}
        values={failed?.values ?? toFormValues(resultSet, defaultSchool)}
        errors={failed?.fieldErrors ?? {}}
        message={failed?.message}
        pending={pending}
      />
    </form>
  );
}

type FormFieldsProps = {
  schools: ResultSchoolOption[];
  resultSet?: ResultSet;
  backHref: string;
  values: ResultFormValues;
  errors: FieldErrors;
  message?: string;
  pending: boolean;
};

/** Selection on the left, one upload row per class on the right. */
function FormFields({ schools, resultSet, backHref, values, errors, message, pending }: FormFieldsProps) {
  const [current, setCurrent] = useState(values);
  const [newFiles, setNewFiles] = useState<Set<number>>(new Set());
  const [removed, setRemoved] = useState(() => parseLevels(values.removeClasses));
  const track = (field: keyof ResultFormValues) => (value: string) =>
    setCurrent((prev) => ({ ...prev, [field]: value }));

  const school = schools.find(({ id }) => id === current.schoolId);
  const customized = school?.type === "CUSTOMIZED";
  const programItems = (school?.programs ?? []).map((value) => ({ value, label: PROGRAM_LABELS[value] }));
  const schoolItems = schools.map(({ id, name, code }) => ({ value: id, label: name, hint: code }));
  const savedClasses = new Map(resultSet?.classes.map((item) => [item.classLevel, item]));

  const selectSchool = (schoolId: string) =>
    setCurrent((prev) => {
      const next = schools.find(({ id }) => id === schoolId);
      const keepProgram = next?.type === "REGULAR" && next.programs.includes(prev.program as Program);
      return {
        ...prev,
        schoolId,
        program: keepProgram ? prev.program : onlyProgram(next),
        programName: next?.type === "CUSTOMIZED" && next.id === prev.schoolId ? prev.programName : undefined,
      };
    });

  const changed =
    newFiles.size > 0 ||
    removed.size > 0 ||
    (resultSet !== undefined && hasChanges(toFormValues(resultSet), current, [...TRACKED_FIELDS]));

  const classError = errors.classes?.[0];
  const readyCount = CLASS_LEVELS.filter(
    (level) => newFiles.has(level) || (savedClasses.has(level) && !removed.has(level)),
  ).length;

  return (
    <DocumentFormShell
      message={message}
      cancelHref={backHref}
      editing={Boolean(resultSet)}
      changed={changed}
      pending={pending}
      uploadLabel="Submit results"
    >
      {classError && (
        <p role="alert" className="flex items-center gap-2 border-b border-destructive/15 bg-destructive/5 px-6 py-2.5 text-sm font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {classError}
        </p>
      )}
      <input type="hidden" name="removeClasses" value={[...removed].join(",")} />

      <div className="grid divide-y divide-brand-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <Column title="Selection" description="Who these results are for.">
          <div className="flex flex-col gap-4">
            <SelectField
              name="schoolId"
              label="School"
              placeholder={schools.length > 0 ? "Select a school" : "No schools yet"}
              items={schoolItems}
              defaultValue={values.schoolId}
              onValueChange={selectSchool}
              disabled={schools.length === 0}
              errors={errors.schoolId}
            />

            {school && (
              <div className="-mt-2 flex items-center gap-2.5 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 animate-in fade-in-0 duration-200">
                <SchoolTypeBadge type={school.type} size="sm" />
                <span className="text-xs text-neutral-600">
                  {customized ? "Enter this school's own program name." : "Pick one of this school's programs."}
                </span>
              </div>
            )}

            {customized ? (
              <div key={`name-${school.id}`} className="flex flex-col gap-2 animate-in fade-in-0 duration-200">
                <label htmlFor="programName" className="text-[13px] font-medium text-neutral-800">
                  Program <span className="text-brand-600">*</span>
                </label>
                <Input
                  id="programName"
                  name="programName"
                  placeholder="e.g. Program Name"
                  defaultValue={current.programName}
                  onChange={(event) => track("programName")(event.currentTarget.value)}
                  aria-invalid={errors.programName?.length ? true : undefined}
                  maxLength={120}
                  className="h-11 rounded-lg border-neutral-200 bg-white px-3.5 text-sm shadow-xs hover:border-brand-300 focus-visible:border-brand-600 focus-visible:ring-brand-600/15"
                />
                {errors.programName?.length ? <FieldError>{errors.programName[0]}</FieldError> : null}
              </div>
            ) : (
              <SelectField
                key={`program-${current.schoolId ?? "none"}`}
                name="program"
                label="Program"
                placeholder={school ? "Select a program" : "Select a school first"}
                items={programItems}
                defaultValue={current.program}
                onValueChange={track("program")}
                disabled={!school || programItems.length === 0}
                errors={school && programItems.length === 0 ? ["This school has no programs yet."] : errors.program}
              />
            )}

            <SelectField
              name="testNumber"
              label="Test"
              placeholder="Select a test"
              items={testItems}
              defaultValue={values.testNumber}
              onValueChange={track("testNumber")}
              errors={errors.testNumber}
            />
          </div>
        </Column>

        {CLASS_GROUPS.map((levels, index) => (
          <Column
            key={levels[0]}
            title={`Classes ${levels[0]} – ${levels.at(-1)}`}
            description="One Excel (.xlsx) sheet per class."
            aside={
              index === 0 && (
                <span className="shrink-0 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 tabular-nums">
                  {readyCount} of {CLASS_LEVELS.length} ready
                </span>
              )
            }
          >
            <ul
              className={cn(
                "divide-y divide-brand-100/70 overflow-hidden rounded-xl border border-brand-100",
                classError && "border-destructive/40",
              )}
            >
              {levels.map((level) => (
                <ClassFileRow
                  key={level}
                  classLevel={level}
                  saved={savedClasses.get(level)}
                  removed={removed.has(level)}
                  onRemovedChange={(on) => setRemoved((prev) => toggle(prev, level, on))}
                  onFileChange={(on) => setNewFiles((prev) => toggle(prev, level, on))}
                  errors={errors[classFileField(level)]}
                />
              ))}
            </ul>
          </Column>
        ))}
      </div>
    </DocumentFormShell>
  );
}

function Column({
  title,
  description,
  aside,
  className,
  children,
}: {
  title: string;
  description: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("px-5 py-4", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-neutral-950">{title}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
