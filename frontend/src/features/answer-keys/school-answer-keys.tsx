"use client";

import { useState } from "react";
import { CalendarClock, Download, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { programs } from "@/features/teachers-resources/content";
import type { AnswerKey } from "@/types/answer-key";
import type { Program } from "@/types/school";
import { classLabel, formatDateTime } from "@/utils/format";
import {
  formatFileSize,
  schoolAnswerKeyDownloadHref,
  schoolAnswerKeyFileHref,
  wasEdited,
} from "./constants";

type SchoolAnswerKeysProps = {
  /** Programs assigned to the signed-in school. */
  programIds: Program[];
  answerKeys: AnswerKey[];
};

export function SchoolAnswerKeys({ programIds, answerKeys }: SchoolAnswerKeysProps) {
  const visiblePrograms = programs.filter((program) => programIds.includes(program.id));
  const [programId, setProgramId] = useState(visiblePrograms[0]?.id);
  const [classLevel, setClassLevel] = useState<number | null>(null);

  if (visiblePrograms.length === 0) {
    return (
      <Notice>No programs have been assigned to your school yet. Please contact Vitaran.</Notice>
    );
  }

  const activeProgram = visiblePrograms.find((program) => program.id === programId);
  const programKeys = answerKeys.filter((key) => key.program === programId);
  const classes = [...new Set(programKeys.map((key) => key.classLevel))].sort((a, b) => a - b);
  const shownClasses = classLevel && classes.includes(classLevel) ? [classLevel] : classes;

  return (
    <div className="space-y-6">
      {visiblePrograms.length > 1 && (
        <div
          role="tablist"
          aria-label="Program"
          className="flex flex-wrap gap-2 rounded-2xl border border-brand-100 bg-white p-1.5"
        >
          {visiblePrograms.map((program) => {
            const active = program.id === programId;
            const count = answerKeys.filter((key) => key.program === program.id).length;
            return (
              <button
                key={program.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setProgramId(program.id);
                  setClassLevel(null);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-brand-900 text-white" : "text-brand-800 hover:bg-brand-50",
                )}
              >
                <program.icon className="size-4" />
                {program.title}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] tabular-nums",
                    active ? "bg-white/15 text-white" : "bg-brand-50 text-brand-700",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeProgram && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-100 pb-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-500 uppercase">Program</p>
            <h2 className="mt-1 text-2xl font-bold text-neutral-950">{activeProgram.title}</h2>
          </div>
          <p className="text-sm text-neutral-500">
            <span className="font-semibold text-neutral-900">{programKeys.length}</span>{" "}
            {programKeys.length === 1 ? "answer key" : "answer keys"} across{" "}
            <span className="font-semibold text-neutral-900">{classes.length}</span>{" "}
            {classes.length === 1 ? "class" : "classes"}
          </p>
        </div>
      )}

      {programKeys.length === 0 ? (
        <Notice>Answer keys for this program will be available here soon.</Notice>
      ) : (
        <>
          {classes.length > 1 && (
            <div className="flex flex-wrap items-center gap-2" aria-label="Filter by class">
              <FilterChip active={classLevel === null} onClick={() => setClassLevel(null)}>
                All classes
              </FilterChip>
              {classes.map((level) => (
                <FilterChip key={level} active={classLevel === level} onClick={() => setClassLevel(level)}>
                  {classLabel(level)}
                </FilterChip>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {shownClasses.map((level) => {
              const keys = programKeys.filter((key) => key.classLevel === level);
              return (
                <section
                  key={level}
                  className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_12px_32px_-20px_rgb(25_28_95/0.35)]"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-brand-100 bg-brand-50/60 px-5 py-3.5 sm:px-6">
                    <h3 className="text-lg font-bold text-neutral-950">{classLabel(level)}</h3>
                    <span className="rounded-full border border-brand-100 bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                      {keys.length} {keys.length === 1 ? "answer key" : "answer keys"}
                    </span>
                  </header>
                  <ul className="divide-y divide-brand-100/70">
                    {keys.map((key) => (
                      <AnswerKeyRow key={key.id} answerKey={key} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function AnswerKeyRow({ answerKey: key }: { answerKey: AnswerKey }) {
  const edited = wasEdited(key);

  return (
    <li className="grid gap-4 px-5 py-4 transition-colors hover:bg-brand-50/40 sm:px-6 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-center md:gap-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-900 text-white">
          <span className="text-[9px] font-semibold tracking-wider text-white/70 uppercase">Test</span>
          <span className="text-lg leading-none font-bold tabular-nums">{key.testNumber}</span>
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-neutral-950">Test {key.testNumber} answer key</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">{key.fileName}</span>
            <span className="text-neutral-300">·</span>
            <span className="shrink-0">{formatFileSize(key.fileSize)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 md:border-l md:border-brand-100 md:pl-6">
        <CalendarClock className="size-4 shrink-0 text-brand-700" />
        <div>
          <p className="text-xs font-bold text-neutral-950">{edited ? "Updated on" : "Published on"}</p>
          <p className="text-sm whitespace-nowrap text-neutral-600 tabular-nums">
            {formatDateTime(key.updatedAt)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={schoolAnswerKeyFileHref(key.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3.5 text-sm font-semibold text-brand-900 transition-colors hover:border-brand-900 hover:bg-brand-50 md:flex-none"
        >
          <Eye className="size-4" />
          View
        </a>
        <a
          href={schoolAnswerKeyDownloadHref(key.id)}
          download={key.fileName}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-900 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 active:scale-[0.98] md:flex-none"
        >
          <Download className="size-4" />
          Download
        </a>
      </div>
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-brand-900 bg-brand-900 text-white"
          : "border-brand-200 bg-white text-brand-800 hover:border-brand-400",
      )}
    >
      {children}
    </button>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center text-sm font-medium text-brand-700">
      {children}
    </p>
  );
}
