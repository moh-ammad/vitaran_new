"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { wasEdited } from "@/features/documents/constants";
import type { ResultSet } from "@/types/result";
import { formatDateTime, formatNumber } from "@/utils/format";
import { resultProgramLabel, resultSetHref, TEACHER_RESULTS_PATH } from "./constants";

/** What a signed-in school or teacher sees: a tab per program, then a card per test with its classes. */
export function SchoolResults({
  resultSets,
  basePath = TEACHER_RESULTS_PATH,
}: {
  resultSets: ResultSet[];
  basePath?: string;
}) {
  const programs = [...new Set(resultSets.map(resultProgramLabel))].sort((a, b) => a.localeCompare(b));
  const [program, setProgram] = useState(programs[0]);

  if (resultSets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-brand-900 text-white">
          <Trophy className="size-5" />
        </span>
        <p className="text-base font-semibold text-neutral-950">No results yet</p>
        <p className="max-w-sm text-sm text-brand-700">
          Test results for your school will appear here as soon as they&apos;re published.
        </p>
      </div>
    );
  }

  const tests = resultSets
    .filter((resultSet) => resultProgramLabel(resultSet) === program)
    .sort((a, b) => b.testNumber - a.testNumber);

  return (
    <div className="space-y-6">
      {programs.length > 1 && (
        <div role="tablist" aria-label="Program" className="flex flex-wrap gap-2 rounded-2xl border border-brand-100 bg-white p-1.5">
          {programs.map((label) => {
            const active = label === program;
            const count = resultSets.filter((resultSet) => resultProgramLabel(resultSet) === label).length;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setProgram(label)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-brand-900 text-white" : "text-brand-800 hover:bg-brand-50",
                )}
              >
                {label}
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

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-100 pb-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-500 uppercase">Program</p>
          <h2 className="mt-1 text-2xl font-bold text-neutral-950">{program}</h2>
        </div>
        <p className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-900">{tests.length}</span> {tests.length === 1 ? "test" : "tests"}
        </p>
      </div>

      <div className="space-y-4">
        {tests.map((resultSet) => {
          const students = resultSet.classes.reduce((sum, item) => sum + item.rowCount, 0);
          return (
            <article
              key={resultSet.id}
              className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_12px_32px_-20px_rgb(25_28_95/0.35)]"
            >
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 bg-brand-50/60 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-900 text-white">
                    <span className="text-[8px] font-semibold tracking-wider text-white/70 uppercase">ID</span>
                    <span className="text-lg leading-none font-bold tabular-nums">{resultSet.testNumber}</span>
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-950">
                      Test ID {resultSet.testNumber} results
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-600">
                      <Users className="size-3.5 text-brand-700" />
                      {resultSet.classes.length} {resultSet.classes.length === 1 ? "class" : "classes"} ·{" "}
                      {formatNumber(students)} students
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="size-4 shrink-0 text-brand-700" />
                  <div>
                    <p className="text-xs font-bold text-neutral-950">
                      {wasEdited(resultSet) ? "Updated on" : "Published on"}
                    </p>
                    <p className="text-sm whitespace-nowrap text-neutral-600 tabular-nums">
                      {formatDateTime(resultSet.updatedAt)}
                    </p>
                  </div>
                </div>
              </header>

              <ul className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                {resultSet.classes.map((item) => (
                  <li key={item.classLevel}>
                    <Link
                      href={resultSetHref(basePath, resultSet.id, item.classLevel)}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white px-4 py-3 transition-colors hover:border-brand-900 hover:bg-brand-50"
                    >
                      <span>
                        <span className="block text-sm font-bold text-neutral-950">Class {item.classLevel}</span>
                        <span className="text-xs text-neutral-500">{item.rowCount} students</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:text-brand-900">
                        View
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
