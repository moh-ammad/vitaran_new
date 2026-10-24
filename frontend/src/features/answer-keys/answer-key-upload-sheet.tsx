"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PdfField } from "@/features/documents/pdf-field";
import { programLabel } from "@/features/schools/constants";
import type { LearningProgram } from "@/types/program";
import { uploadAnswerKeyAction } from "./actions";
import type { DrivePath } from "./drive-path";
import type { AnswerKeyFormState } from "./schema";

type AnswerKeyUploadSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: DrivePath;
  /** Curriculum code for customized uploads (school's first enrolled program). */
  curriculumProgram?: string;
  programs: LearningProgram[];
};

export function AnswerKeyUploadSheet({
  open,
  onOpenChange,
  path,
  curriculumProgram,
  programs,
}: AnswerKeyUploadSheetProps) {
  const programCode = path.program ?? curriculumProgram;
  const titleParts = [
    path.program
      ? programLabel(path.program, programs.find((program) => program.code === path.program)?.name)
      : null,
    path.testNumber ? `Test ${path.testNumber}` : null,
    path.classLevel ? `Class ${path.classLevel}` : null,
  ].filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Upload</SheetTitle>
          {titleParts.length > 0 ? (
            <p className="text-sm text-neutral-500">{titleParts.join(" · ")}</p>
          ) : null}
        </SheetHeader>
        {open && path.testNumber && path.classLevel && programCode ? (
          <UploadForm
            key={`${programCode}-${path.schoolId ?? ""}-${path.testNumber}-${path.classLevel}`}
            program={programCode}
            schoolId={path.schoolId}
            testNumber={path.testNumber}
            classLevel={path.classLevel}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <p className="px-4 text-sm text-neutral-500">Open a test, then upload for a class.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}

function UploadForm({
  program,
  schoolId,
  testNumber,
  classLevel,
  onDone,
}: {
  program: string;
  schoolId?: string;
  testNumber: number;
  classLevel: number;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<AnswerKeyFormState, FormData>(
    uploadAnswerKeyAction,
    undefined,
  );
  const failed = state?.status === "error" ? state : undefined;

  useEffect(() => {
    if (state?.status !== "success") return;
    toast.success("Uploaded");
    onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4 px-4 pb-4">
      <input type="hidden" name="type" value={schoolId ? "CUSTOMIZED" : "REGULAR"} />
      <input type="hidden" name="program" value={program} />
      {schoolId ? <input type="hidden" name="schoolId" value={schoolId} /> : null}
      <input type="hidden" name="testNumber" value={String(testNumber)} />
      <input type="hidden" name="testId" value={`T-${testNumber}`} />
      <input type="hidden" name="classLevel" value={String(classLevel)} />

      {failed?.message ? (
        <Alert variant="destructive">
          <AlertDescription>{failed.message}</AlertDescription>
        </Alert>
      ) : null}
      {failed?.fieldErrors?.file?.[0] ? (
        <Alert variant="destructive">
          <AlertDescription>{failed.fieldErrors.file[0]}</AlertDescription>
        </Alert>
      ) : null}

      <PdfField errors={failed?.fieldErrors?.file} onFileChange={() => undefined} />

      <Button type="submit" disabled={pending} className="h-11 w-full rounded-lg">
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload />
            Upload
          </>
        )}
      </Button>
    </form>
  );
}
