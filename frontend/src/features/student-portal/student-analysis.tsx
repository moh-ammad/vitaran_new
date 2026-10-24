"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Panel } from "@/features/admin/dashboard-parts";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/school";
import { ChartPair, CompareBarChart, KpiTile, StudentEmpty, SubjectBarChart } from "./student-ui";
import { MIX_COLORS, MPCB, SUBJECT_COLORS } from "./subject-colors";
import { byDate, formatDate, percentOf, reviewHref, testHref, testLabel, type StudentTest } from "./types";

type SubjectFilter = "ALL" | Subject;

function sumCounts(tests: StudentTest[], subject: SubjectFilter) {
  return tests.reduce(
    (sum, test) => {
      if (subject === "ALL") {
        const row = test.counts;
        if (!row) return sum;
        return {
          correct: sum.correct + row.correct,
          wrong: sum.wrong + row.wrong,
          blank: sum.blank + row.blank,
          invalid: sum.invalid + row.invalid,
        };
      }
      const row = test.subjects.find((item) => item.subject === subject);
      if (row?.correct == null && row?.wrong == null) return sum;
      return {
        correct: sum.correct + (row.correct ?? 0),
        wrong: sum.wrong + (row.wrong ?? 0),
        blank: sum.blank + (row.blank ?? 0),
        invalid: sum.invalid,
      };
    },
    { correct: 0, wrong: 0, blank: 0, invalid: 0 },
  );
}

function scoreOf(test: StudentTest, subject: SubjectFilter) {
  if (subject === "ALL") return { score: test.total, max: test.maxTotal, pct: test.percentage };
  const row = test.subjects.find((item) => item.subject === subject);
  return { score: row?.score ?? null, max: row?.max ?? null, pct: row ? percentOf(row.score, row.max) : null };
}

export function StudentAnalysisBoard({ tests }: { tests: StudentTest[] }) {
  const [subject, setSubject] = useState<SubjectFilter>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");

  const present = useMemo(() => {
    const seen = new Set(tests.flatMap((test) => test.subjects.map((row) => row.subject)));
    const paper = MPCB.filter((id) => seen.has(id));
    return paper.length ? paper : [...seen];
  }, [tests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^test\s*/, "");
    return tests.filter((test) => {
      if (q && !test.testId.toLowerCase().includes(q) && String(test.testNumber) !== q) return false;
      if (from && (!test.date || test.date < from)) return false;
      if (to && (!test.date || test.date > to)) return false;
      if (subject !== "ALL" && !test.subjects.some((row) => row.subject === subject)) return false;
      return true;
    });
  }, [tests, query, from, to, subject]);

  const scored = [...filtered].filter((test) => scoreOf(test, subject).pct != null).sort(byDate);
  const latest = scored.at(-1) ?? null;
  const previous = scored.at(-2) ?? null;
  const latestScore = latest ? scoreOf(latest, subject) : null;
  const previousScore = previous ? scoreOf(previous, subject) : null;
  const delta =
    latestScore?.pct != null && previousScore?.pct != null
      ? Math.round((latestScore.pct - previousScore.pct) * 10) / 10
      : null;
  const avg = scored.length
    ? Math.round((scored.reduce((sum, test) => sum + (scoreOf(test, subject).pct ?? 0), 0) / scored.length) * 10) / 10
    : null;

  const mixTotals = sumCounts(filtered, subject);
  const mixAsked = mixTotals.correct + mixTotals.wrong + mixTotals.blank + mixTotals.invalid;
  const mix = [
    { name: "Correct", value: mixTotals.correct, fill: MIX_COLORS.Correct },
    { name: "Wrong", value: mixTotals.wrong, fill: MIX_COLORS.Wrong },
    { name: "Blank", value: mixTotals.blank, fill: MIX_COLORS.Blank },
    { name: "Invalid", value: mixTotals.invalid, fill: MIX_COLORS.Invalid },
  ];
  const attempted = mixTotals.correct + mixTotals.wrong;
  const accuracy = attempted ? Math.round((mixTotals.correct / attempted) * 1000) / 10 : null;

  const subjectBar: Array<{ name: string; value: number; fill: string }> = [];
  const subjectPie: Array<{ name: string; value: number; fill: string }> = [];
  const compare: Array<{ name: string; latest: number; previous: number | null }> = [];

  if (subject === "ALL") {
    const percents = new Map<Subject, number[]>();
    const marks = new Map<Subject, number>();
    for (const test of filtered) {
      for (const row of test.subjects) {
        const pct = percentOf(row.score, row.max);
        if (pct != null) percents.set(row.subject, [...(percents.get(row.subject) ?? []), pct]);
        marks.set(row.subject, (marks.get(row.subject) ?? 0) + Math.max(0, row.score));
      }
    }
    for (const id of present) {
      const values = percents.get(id);
      if (values?.length) {
        subjectBar.push({
          name: SUBJECT_LABELS[id],
          value: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
          fill: SUBJECT_COLORS[id],
        });
      }
      const mark = marks.get(id) ?? 0;
      if (mark > 0) subjectPie.push({ name: SUBJECT_LABELS[id], value: Math.round(mark), fill: SUBJECT_COLORS[id] });
      const latestRow = latest?.subjects.find((row) => row.subject === id);
      const previousRow = previous?.subjects.find((row) => row.subject === id);
      const latestPct = latestRow ? percentOf(latestRow.score, latestRow.max) : null;
      if (latestPct != null) {
        compare.push({
          name: SUBJECT_LABELS[id],
          latest: latestPct,
          previous: previousRow ? percentOf(previousRow.score, previousRow.max) : null,
        });
      }
    }
  } else {
    for (const test of scored) {
      const pct = scoreOf(test, subject).pct;
      if (pct == null) continue;
      subjectBar.push({ name: testLabel(test), value: pct, fill: SUBJECT_COLORS[subject] });
    }
    subjectPie.push(...mix.filter((row) => row.value > 0));
    if (latestScore?.pct != null) {
      compare.push({
        name: SUBJECT_LABELS[subject],
        latest: latestScore.pct,
        previous: previousScore?.pct ?? null,
      });
    }
  }

  if (tests.length === 0) {
    return (
      <StudentEmpty
        title="No results to analyse"
        hint="Filters and charts appear here after your class teacher publishes a test."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Filter your performance" description="Subject, test ID or date range" compact>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={subject === "ALL"} onClick={() => setSubject("ALL")}>
            All subjects
          </FilterChip>
          {present.map((id) => (
            <FilterChip key={id} active={subject === id} onClick={() => setSubject(id)}>
              {SUBJECT_LABELS[id]}
            </FilterChip>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Test ID or test no."
            className="h-9"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            From
            <Input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="h-9" />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            To
            <Input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="h-9" />
          </label>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Tests in view" value={filtered.length} hint={`${tests.length} published`} />
        <KpiTile label="Average" value={avg != null ? `${avg}%` : "—"} tone="brand" hint={subject === "ALL" ? "All subjects" : SUBJECT_LABELS[subject]} />
        <KpiTile label="Correct" value={mixAsked ? mixTotals.correct : "—"} tone="good" hint={accuracy != null ? `${accuracy}% accuracy` : "From OMR scans"} />
        <KpiTile label="Wrong" value={mixAsked ? mixTotals.wrong : "—"} tone="bad" hint={mixAsked ? `${mixTotals.blank} blank · ${mixTotals.invalid} invalid` : "From OMR scans"} />
      </div>

      {filtered.length === 0 ? (
        <StudentEmpty title="Nothing matches" hint="Clear a filter or pick another subject / date range." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <CompareCard label="Latest" test={latest} score={latestScore} subject={subject} accent delta={delta} />
            <CompareCard label="Previous" test={previous} score={previousScore} subject={subject} />
          </div>

          {compare.length > 0 && (
            <Panel title="Past test vs latest" description="Percentage by subject" compact>
              <CompareBarChart data={compare} />
            </Panel>
          )}

          {mixAsked ? (
            <ChartPair barTitle="Right vs wrong" pieTitle="Answer mix" bar={mix} pie={mix} barKind="count" />
          ) : (
            <Panel title="Right vs wrong" description="How you answered" compact>
              <p className="py-6 text-center text-sm text-neutral-500">
                Right vs wrong is available on OMR tests after the class teacher publishes them.
              </p>
            </Panel>
          )}

          {subject === "ALL" && subjectBar.length > 0 && (
            <ChartPair
              barTitle="Average by subject"
              pieTitle="Marks by subject"
              bar={subjectBar}
              pie={subjectPie}
              pieUnit=" marks"
            />
          )}
          {subject !== "ALL" && subjectBar.length > 0 && (
            <Panel title={`${SUBJECT_LABELS[subject]} by test`} description="Bar chart" compact>
              <SubjectBarChart data={subjectBar} kind="percent" />
            </Panel>
          )}

          <Panel title="Tests in this filter" description={`${filtered.length} of ${tests.length}`} compact>
            <ul className="grid gap-2 sm:grid-cols-2">
              {filtered
                .slice()
                .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.testNumber - a.testNumber)
                .map((test) => {
                  const row = scoreOf(test, subject);
                  return (
                    <li key={test.key}>
                      <Link
                        href={testHref(test)}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-white px-4 py-3 transition-colors hover:border-brand-900 hover:bg-brand-50"
                      >
                        <span>
                          <span className="block text-sm font-bold text-neutral-950">{testLabel(test)}</span>
                          <span className="text-xs text-neutral-500">
                            ID {test.testId} · {formatDate(test.date)}
                            {test.source === "omr" ? " · OMR" : ""}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-right">
                            <span className="block text-sm font-bold tabular-nums text-brand-900">
                              {row.score ?? "—"}
                              {row.max != null ? (
                                <span className="font-medium text-neutral-400">/{row.max}</span>
                              ) : null}
                            </span>
                            {row.pct != null && <span className="text-xs text-neutral-500">{row.pct}%</span>}
                          </span>
                          <ChevronRight className="size-4 text-brand-700 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                      {test.source === "omr" && (
                        <Link
                          href={reviewHref(test)}
                          className="mt-1 inline-block px-1 text-xs font-semibold text-brand-800 hover:text-brand-950"
                        >
                          See explanations
                        </Link>
                      )}
                    </li>
                  );
                })}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}

function CompareCard({
  label,
  test,
  score,
  subject,
  accent,
  delta,
}: {
  label: string;
  test: StudentTest | null;
  score: { score: number | null; max: number | null; pct: number | null } | null;
  subject: SubjectFilter;
  accent?: boolean;
  delta?: number | null;
}) {
  return (
    <Panel title={label} description={test ? `${testLabel(test)} · ${formatDate(test.date)}` : "No earlier test"} compact>
      {test && score ? (
        <div>
          <p className={cn("text-3xl font-bold tabular-nums", accent ? "text-brand-900" : "text-neutral-950")}>
            {score.pct != null ? `${score.pct}%` : "—"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {score.score ?? "—"}
            {score.max != null ? `/${score.max}` : ""}
            {subject !== "ALL" ? ` · ${SUBJECT_LABELS[subject]}` : ""}
          </p>
          {test.counts && subject === "ALL" && (
            <p className="mt-2 text-xs text-neutral-600">
              <span className="font-semibold text-emerald-700">{test.counts.correct} correct</span>
              {" · "}
              <span className="font-semibold text-rose-700">{test.counts.wrong} wrong</span>
            </p>
          )}
          {delta != null && (
            <p className={cn("mt-2 text-xs font-semibold", delta >= 0 ? "text-emerald-700" : "text-rose-700")}>
              {delta >= 0 ? "+" : ""}
              {delta}% vs previous
            </p>
          )}
        </div>
      ) : (
        <p className="py-4 text-sm text-neutral-500">Take another published test to compare.</p>
      )}
    </Panel>
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
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
        active ? "bg-brand-900 text-white" : "border border-brand-100 bg-white text-brand-800 hover:bg-brand-50",
      )}
    >
      {children}
    </button>
  );
}
