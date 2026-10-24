"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Panel } from "@/features/admin/dashboard-parts";
import { cn } from "@/lib/utils";
import { StudentEmpty } from "./student-ui";
import { formatDate, reviewHref, testHref, testLabel, type StudentTest } from "./types";

type Sort = "newest" | "oldest" | "highest" | "lowest";

const SORTS: Array<{ id: Sort; label: string }> = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "highest", label: "Highest score" },
  { id: "lowest", label: "Lowest score" },
];

export function StudentTestList({ tests }: { tests: StudentTest[] }) {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^test\s*/, "");
    const filtered = tests.filter((test) => {
      if (q && !test.testId.toLowerCase().includes(q) && String(test.testNumber) !== q) return false;
      if (from && (!test.date || test.date < from)) return false;
      if (to && (!test.date || test.date > to)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "highest") return (b.percentage ?? -1) - (a.percentage ?? -1);
      if (sort === "lowest") return (a.percentage ?? 101) - (b.percentage ?? 101);
      const order = (a.date ?? "").localeCompare(b.date ?? "") || a.testNumber - b.testNumber;
      return sort === "oldest" ? order : -order;
    });
  }, [tests, query, from, to, sort]);

  if (tests.length === 0) {
    return (
      <StudentEmpty
        title="No results yet"
        hint="They show here once your class teacher publishes them."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Find a test" description={`${rows.length} of ${tests.length}`} compact>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="relative block sm:col-span-1">
            <span className="sr-only">Search by test ID or test number</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Test ID or test no."
              className="h-9 pl-8"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            From
            <Input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="h-9" />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            To
            <Input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="h-9" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SORTS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSort(row.id)}
              className={cn(
                "inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                sort === row.id
                  ? "bg-brand-900 text-white"
                  : "border border-brand-100 bg-white text-brand-800 hover:bg-brand-50",
              )}
            >
              {row.label}
            </button>
          ))}
        </div>
      </Panel>

      {rows.length === 0 ? (
        <StudentEmpty title="No tests match" hint="Clear a filter or pick another date range." />
      ) : (
        <div className="space-y-4">
          {rows.map((test) => (
            <article
              key={test.key}
              className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_12px_32px_-20px_rgb(25_28_95/0.35)]"
            >
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 bg-brand-50/60 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-900 text-white">
                    <span className="text-[8px] font-semibold tracking-wider text-white/70 uppercase">No</span>
                    <span className="text-lg leading-none font-bold tabular-nums">{test.testNumber}</span>
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-950">{testLabel(test)}</h3>
                    <p className="mt-0.5 text-xs text-neutral-600">ID {test.testId}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="text-right">
                    <p className="text-xl font-bold tabular-nums text-brand-900">
                      {test.total ?? "—"}
                      {test.maxTotal != null ? (
                        <span className="text-sm font-semibold text-neutral-400">/{test.maxTotal}</span>
                      ) : null}
                    </p>
                    {test.percentage != null && (
                      <p className="text-xs font-semibold text-neutral-600">{test.percentage}%</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 shrink-0 text-brand-700" />
                    <div>
                      <p className="text-xs font-bold text-neutral-950">Exam date</p>
                      <p className="text-sm whitespace-nowrap text-neutral-600 tabular-nums">{formatDate(test.date)}</p>
                    </div>
                  </div>
                </div>
              </header>

              <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 sm:px-6">
                {test.source === "omr" && (
                  <Link
                    href={reviewHref(test)}
                    className="inline-flex h-9 items-center rounded-lg bg-brand-900 px-3.5 text-sm font-semibold text-white hover:bg-brand-950"
                  >
                    See explanations
                  </Link>
                )}
                <Link
                  href={testHref(test)}
                  className="inline-flex h-9 items-center rounded-lg border border-brand-100 bg-white px-3.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Subject scores
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
