"use client";

import { useMemo, useState, useTransition } from "react";
import { Camera, CheckCircle2, Loader2, ScanLine, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { capitalizeWords } from "@/features/schools/schema";

export type OmrTestOption = {
  testNumber: number;
  programCode: string;
  programName: string;
  classLevels: number[];
};

type OmrScanFormProps = {
  tests: OmrTestOption[];
  teacherName: string;
};

export function OmrScanForm({ tests, teacherName }: OmrScanFormProps) {
  const [pending, startTransition] = useTransition();
  const [testKey, setTestKey] = useState(() =>
    tests[0] ? `${tests[0].programCode}:${tests[0].testNumber}` : "",
  );
  const [classLevel, setClassLevel] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState<{
    testNumber: number;
    classLevel: number;
    fileName: string;
  } | null>(null);

  const selected = useMemo(
    () => tests.find((item) => `${item.programCode}:${item.testNumber}` === testKey),
    [tests, testKey],
  );

  const classes = selected?.classLevels ?? [];

  return (
    <form
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!selected || !classLevel || !file) {
          toast.error("Pick a test, class, and OMR sheet image.");
          return;
        }

        startTransition(async () => {
          // Client-side capture for now — processing pipeline comes next.
          await new Promise((resolve) => setTimeout(resolve, 600));
          setDone({
            testNumber: selected.testNumber,
            classLevel: Number(classLevel),
            fileName: file.name,
          });
          toast.success("OMR sheet received");
          setFile(null);
        });
      }}
    >
      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">OMR Scan</p>
        <h2 className="mt-1 text-xl font-bold text-neutral-950">
          Scan sheets · {capitalizeWords(teacherName)}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Choose the test ID and class, then upload or capture the OMR sheet.
        </p>
      </div>

      {tests.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          No published tests for your classes yet. Answer keys or results must be published first.
        </p>
      ) : (
        <>
          <Field>
            <FieldLabel htmlFor="omr-test">Test ID</FieldLabel>
            <Select
              items={tests.map((item) => ({
                value: `${item.programCode}:${item.testNumber}`,
                label: `Test ID ${item.testNumber} · ${capitalizeWords(item.programName)}`,
              }))}
              value={testKey}
              onValueChange={(value) => {
                setTestKey(String(value ?? ""));
                setClassLevel("");
                setDone(null);
              }}
            >
              <SelectTrigger id="omr-test" className="h-11 w-full font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tests.map((item) => (
                  <SelectItem
                    key={`${item.programCode}:${item.testNumber}`}
                    value={`${item.programCode}:${item.testNumber}`}
                  >
                    Test ID {item.testNumber} · {capitalizeWords(item.programName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Class</FieldLabel>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {classes.map((level) => {
                const id = `omr-class-${level}`;
                const checked = classLevel === level;
                return (
                  <li key={level}>
                    <label
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-bold",
                        checked
                          ? "border-brand-200 bg-brand-50 text-brand-900"
                          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300",
                      )}
                    >
                      <input
                        id={id}
                        type="radio"
                        name="classLevel"
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          setClassLevel(level);
                          setDone(null);
                        }}
                      />
                      Class {level}
                    </label>
                  </li>
                );
              })}
            </ul>
          </Field>

          <Field>
            <FieldLabel htmlFor="omr-file">OMR sheet</FieldLabel>
            <label
              htmlFor="omr-file"
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
                file
                  ? "border-brand-300 bg-brand-50/50"
                  : "border-neutral-300 bg-neutral-50 hover:border-brand-300 hover:bg-brand-50/30",
              )}
            >
              {file ? (
                <>
                  <Upload className="size-8 text-brand-800" />
                  <span className="text-sm font-bold text-neutral-950">{file.name}</span>
                  <span className="text-xs text-neutral-500">Tap to choose another image</span>
                </>
              ) : (
                <>
                  <Camera className="size-8 text-brand-800" />
                  <span className="text-sm font-bold text-neutral-950">Upload or capture sheet</span>
                  <span className="text-xs text-neutral-500">JPG, PNG · clear, well-lit photo</span>
                </>
              )}
              <input
                id="omr-file"
                type="file"
                accept="image/*,.jpg,.jpeg,.png"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setDone(null);
                }}
              />
            </label>
          </Field>

          <Button type="submit" className="w-full sm:w-auto" disabled={pending || !file || !classLevel}>
            {pending ? <Loader2 className="animate-spin" /> : <ScanLine />}
            {pending ? "Submitting…" : "Submit OMR scan"}
          </Button>
        </>
      )}

      {done && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-bold">Scan received</p>
            <p className="mt-0.5 text-emerald-800">
              Test ID {done.testNumber} · Class {done.classLevel} · {done.fileName}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
