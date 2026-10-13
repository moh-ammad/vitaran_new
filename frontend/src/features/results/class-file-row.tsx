"use client";

import { useId, useRef, useState } from "react";
import { RotateCcw, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/features/documents/constants";
import type { ResultClass } from "@/types/result";
import { classFileField, EXCEL_ACCEPT, EXCEL_MAX_BYTES, studentCount } from "./constants";

type ClassFileRowProps = {
  classLevel: number;
  /** The sheet already saved for this class, when editing. */
  saved?: ResultClass;
  removed: boolean;
  onRemovedChange: (removed: boolean) => void;
  onFileChange: (hasFile: boolean) => void;
  errors?: string[];
};

const ACTION =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors [&_svg]:size-3.5";
const ICON_ACTION = "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors [&_svg]:size-3.5";

function checkFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) return "Only Excel (.xlsx) files can be uploaded.";
  if (file.size > EXCEL_MAX_BYTES) return "Keep the file under 2 MB.";
  return null;
}

export function ClassFileRow({
  classLevel,
  saved,
  removed,
  onRemovedChange,
  onFileChange,
  errors,
}: ClassFileRowProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError ?? (file ? null : errors?.[0]);

  function selectFile(next: File | null) {
    const problem = next && checkFile(next);
    if (problem) {
      if (inputRef.current) inputRef.current.value = "";
      setLocalError(problem);
      setFile(null);
      onFileChange(false);
      return;
    }
    setLocalError(null);
    setFile(next);
    onFileChange(next !== null);
    if (next && removed) onRemovedChange(false);
  }

  function clearFile() {
    if (inputRef.current) inputRef.current.value = "";
    selectFile(null);
  }

  const state = file ? "new" : saved && removed ? "removed" : saved ? "saved" : "empty";

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 transition-colors",
        state === "new" && "bg-brand-50",
        state === "removed" && "bg-destructive/[0.04]",
        error && "bg-destructive/[0.04]",
      )}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name={classFileField(classLevel)}
        accept={EXCEL_ACCEPT}
        aria-invalid={Boolean(error) || undefined}
        className="sr-only"
        onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
      />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-wide text-neutral-950 uppercase">Class {classLevel}</span>
          {state === "new" && (
            <span className="rounded-full bg-brand-900 px-1.5 py-px text-[9px] font-semibold tracking-wide text-white uppercase">
              New
            </span>
          )}
          {state === "saved" && <span aria-hidden className="size-1.5 rounded-full bg-brand-600" />}
        </p>
        <p
          className={cn(
            "truncate text-[11px]",
            error || state === "removed" ? "font-medium text-destructive" : "text-neutral-500",
          )}
          title={file?.name ?? saved?.fileName}
        >
          {error ??
            (state === "new" && file
              ? `${file.name} · ${formatFileSize(file.size)}`
              : state === "saved" && saved
                ? `${studentCount(saved.rowCount)} · ${saved.fileName}`
                : state === "removed"
                  ? "Removed when you save"
                  : "No sheet yet")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {state === "empty" && (
          <label
            htmlFor={inputId}
            className={cn(ACTION, "border border-brand-200 bg-white text-brand-900 hover:border-brand-900 hover:bg-brand-50")}
          >
            <Upload />
            Upload
          </label>
        )}
        {state === "new" && (
          <>
            <label htmlFor={inputId} className={cn(ACTION, "text-brand-800 hover:bg-white")}>
              Change
            </label>
            <button
              type="button"
              onClick={clearFile}
              title="Undo"
              aria-label={`Undo class ${classLevel} file`}
              className={cn(ICON_ACTION, "text-neutral-500 hover:bg-white hover:text-neutral-950")}
            >
              <X />
            </button>
          </>
        )}
        {state === "saved" && (
          <>
            <label htmlFor={inputId} className={cn(ACTION, "bg-brand-900 text-white hover:bg-brand-800")}>
              <Upload />
              Replace
            </label>
            <button
              type="button"
              onClick={() => onRemovedChange(true)}
              title="Remove this class"
              aria-label={`Remove class ${classLevel}`}
              className={cn(ICON_ACTION, "text-neutral-500 hover:bg-destructive/10 hover:text-destructive")}
            >
              <Trash2 />
            </button>
          </>
        )}
        {state === "removed" && (
          <button
            type="button"
            onClick={() => onRemovedChange(false)}
            className={cn(ACTION, "text-neutral-700 hover:bg-white hover:text-neutral-950")}
          >
            <RotateCcw />
            Undo
          </button>
        )}
      </div>
    </li>
  );
}
