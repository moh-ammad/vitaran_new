"use client";

import { useDeferredValue, useState } from "react";
import { Download, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultCell, ResultSheet } from "@/types/result";
import { studentCount } from "./constants";

function formatCell(value: ResultCell) {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/** Columns with the same value for every student (e.g. "CLASS: 8-OLY") are shown once as tags. */
function splitColumns({ columns, rows }: Pick<ResultSheet, "columns" | "rows">) {
  const constant = (index: number) => {
    const first = rows[0]?.[index] ?? null;
    return rows.length > 1 && first !== null && rows.every((row) => row[index] === first);
  };
  const shown = columns.map((_, index) => index).filter((index) => !constant(index));
  const tags = columns
    .map((label, index) => ({ label, value: rows[0]?.[index] ?? null, index }))
    .filter(({ index }) => !shown.includes(index));
  const numeric = new Set(
    shown.filter((index) => {
      const filled = rows.map((row) => row[index]).filter((value) => value !== null);
      return filled.length > 0 && filled.every((value) => typeof value === "number");
    }),
  );
  return { shown, tags, numeric };
}

type ResultSheetCardProps = {
  sheet: ResultSheet;
  downloadHref: string;
};

/** A class's results: title, search and download in one header, then the students. */
export function ResultSheetCard({ sheet, downloadHref }: ResultSheetCardProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { shown, tags, numeric } = splitColumns(sheet);
  // The sheet's last title line is the specific one, e.g. "TEST-3 9-SEP-2026 (Max. Marks: 300)".
  const detail = sheet.caption.at(-1);

  const visible = deferredQuery
    ? sheet.rows.filter((row) =>
        row.some((value) => value !== null && String(value).toLowerCase().includes(deferredQuery)),
      )
    : sheet.rows;

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_12px_32px_-20px_rgb(25_28_95/0.35)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-neutral-950">Class {sheet.classLevel}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-800">{studentCount(sheet.rowCount)}</span>
            {detail && (
              <>
                <span aria-hidden className="text-neutral-300">·</span>
                <span>{detail}</span>
              </>
            )}
            {tags.map(({ label, value }) => (
              <span
                key={label}
                className="rounded-md border border-brand-100 bg-brand-50 px-1.5 py-px text-[11px] font-medium text-brand-800"
              >
                {label}: {formatCell(value)}
              </span>
            ))}
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="relative flex-1 sm:w-64 sm:flex-none">
            <span className="sr-only">Search students</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search students"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white pr-3 pl-9 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 hover:border-brand-300 focus-visible:border-brand-600 focus-visible:ring-3 focus-visible:ring-brand-600/15"
            />
          </label>
          <a
            href={downloadHref}
            download={sheet.fileName}
            title="Download Excel"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800 active:scale-[0.98]"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </header>

      {visible.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50">
              {shown.map((index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "px-2.5 py-3 text-left align-bottom text-[11px] leading-tight font-semibold tracking-wide wrap-anywhere text-brand-900 uppercase first:pl-5 last:pr-5",
                    numeric.has(index) && "text-right",
                  )}
                >
                  {sheet.columns[index]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {visible.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-brand-50/50">
                {shown.map((index) => (
                  <td
                    key={index}
                    className={cn(
                      "px-2.5 py-2.5 wrap-anywhere text-neutral-700 first:pl-5 last:pr-5",
                      numeric.has(index) && "text-right text-neutral-950 tabular-nums",
                      row[index] === null && "text-neutral-300",
                    )}
                  >
                    {formatCell(row[index] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <SearchX className="size-6 text-brand-300" />
          <p className="text-sm font-semibold text-neutral-900">No students match “{query}”</p>
          <button type="button" onClick={() => setQuery("")} className="text-xs font-semibold text-brand-700 hover:underline">
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}
