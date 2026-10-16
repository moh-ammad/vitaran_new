"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  classItems,
  documentFileHref,
  hasChanges,
  testItems,
} from "@/features/documents/constants";
import { DocumentFormShell, FormSection } from "@/features/documents/document-form-shell";
import { PdfField } from "@/features/documents/pdf-field";
import { SelectField } from "@/features/documents/select-field";
import { TYPE_LABELS } from "@/features/schools/constants";
import type { AnswerKey } from "@/types/answer-key";
import type { SchoolRef } from "@/types/document";
import type { LearningProgram } from "@/types/program";
import { SCHOOL_TYPES } from "@/types/school";
import { updateAnswerKeyAction, uploadAnswerKeyAction } from "./actions";
import { ANSWER_KEYS_PATH } from "./constants";
import type { AnswerKeyFormState, AnswerKeyFormValues } from "./schema";

type FieldErrors = Exclude<AnswerKeyFormState, undefined | { status: "success" }>["fieldErrors"];

const typeItems = SCHOOL_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }));

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
  /** Customized schools, for customized answer keys. */
  schools: SchoolRef[];
  /** Catalog programs for the program dropdown. */
  programs: LearningProgram[];
  /** Present when editing. */
  answerKey?: AnswerKey;
};

export function AnswerKeyForm({ schools, programs, answerKey }: AnswerKeyFormProps) {
  const router = useRouter();
  const action = answerKey ? updateAnswerKeyAction.bind(null, answerKey.id) : uploadAnswerKeyAction;
  const [state, formAction, pending] = useActionState<AnswerKeyFormState, FormData>(action, undefined);

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
        programs={programs}
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
  schools: SchoolRef[];
  programs: LearningProgram[];
  answerKey?: AnswerKey;
  values: AnswerKeyFormValues;
  errors: NonNullable<FieldErrors>;
  message?: string;
  pending: boolean;
};

function FormFields({ schools, programs, answerKey, values, errors, message, pending }: FormFieldsProps) {
  const programItems = programs.map((program) => ({
    value: program.code,
    label: program.name,
  }));
  const [current, setCurrent] = useState(values);
  const [hasNewFile, setHasNewFile] = useState(false);
  const customized = current.type === "CUSTOMIZED";
  const track = (field: keyof AnswerKeyFormValues) => (value: string) =>
    setCurrent((prev) => ({ ...prev, [field]: value }));

  const changed =
    hasNewFile ||
    (answerKey !== undefined &&
      hasChanges(toFormValues(answerKey), current, [
        "program",
        "type",
        "testNumber",
        "classLevel",
        ...(customized ? (["schoolId"] as const) : []),
      ]));

  const schoolItems = schools.map((school) => ({
    value: school.id,
    label: school.name,
    hint: school.code,
  }));

  return (
    <DocumentFormShell
      message={message}
      cancelHref={ANSWER_KEYS_PATH}
      editing={Boolean(answerKey)}
      changed={changed}
      pending={pending}
      uploadLabel="Upload answer key"
    >
      <FormSection title="Program">
        <div className={cn("grid gap-4 sm:grid-cols-2", customized && "lg:grid-cols-3")}>
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
          {customized && (
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
      </FormSection>

      <FormSection title="Test & class">
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
      </FormSection>

      <FormSection title="Answer key file">
        <PdfField
          current={
            answerKey && {
              fileName: answerKey.fileName,
              fileSize: answerKey.fileSize,
              href: documentFileHref(ANSWER_KEYS_PATH, answerKey.id),
            }
          }
          errors={errors.file}
          onFileChange={setHasNewFile}
        />
      </FormSection>
    </DocumentFormShell>
  );
}
