"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/features/admin/page-header";
import { Meter, Panel } from "@/features/admin/dashboard-parts";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import type { Subject } from "@/types/school";
import { ChartPair, KpiTile } from "./student-ui";
import { MIX_COLORS, MPCB, SUBJECT_COLORS } from "./subject-colors";
import { formatDate, percentOf, reviewHref, testLabel, type StudentTest } from "./types";

export function StudentTestDetail({
  test,
  average,
}: {
  test: StudentTest;
  average: Partial<Record<Subject, number>>;
}) {
  const subjects = MPCB.filter((id) => test.subjects.some((row) => row.subject === id)).map((id) => {
    const row = test.subjects.find((item) => item.subject === id)!;
    const pct = percentOf(row.score, row.max);
    const avg = average[id];
    return {
      ...row,
      name: SUBJECT_LABELS[id],
      value: pct ?? 0,
      fill: SUBJECT_COLORS[id],
      pct,
      vsAvg: pct != null && avg != null ? Math.round((pct - avg) * 10) / 10 : null,
    };
  });
  const share = subjects.map((row) => ({ name: row.name, value: Math.max(0, row.score), fill: row.fill }));
  const counts = test.counts;
  const attempted = counts ? counts.correct + counts.wrong : 0;
  const accuracy = counts && attempted ? Math.round((counts.correct / attempted) * 1000) / 10 : null;
  const mix = counts
    ? [
        { name: "Correct", value: counts.correct, fill: MIX_COLORS.Correct },
        { name: "Wrong", value: counts.wrong, fill: MIX_COLORS.Wrong },
        { name: "Blank", value: counts.blank, fill: MIX_COLORS.Blank },
        { name: "Invalid", value: counts.invalid, fill: MIX_COLORS.Invalid },
      ]
    : [];

  return (
    <>
      <PageHeader
        title={testLabel(test)}
        description={`ID ${test.testId} · ${formatDate(test.date)} · ${test.programName} · Class ${test.classLevel}${test.sectionName ? `-${test.sectionName}` : ""}`}
        actions={
          test.source === "omr" ? (
            <Link
              href={reviewHref(test)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-900 px-3 text-sm font-semibold text-white hover:bg-brand-950"
            >
              <ListChecks className="size-4" />
              See explanations
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Score"
          value={test.percentage != null ? `${test.percentage}%` : "—"}
          hint={test.maxTotal != null ? `${test.total ?? "—"}/${test.maxTotal}` : undefined}
          tone="brand"
        />
        <KpiTile label="Correct" value={counts?.correct ?? "—"} tone="good" hint={accuracy != null ? `${accuracy}% accuracy` : "OMR only"} />
        <KpiTile label="Wrong" value={counts?.wrong ?? "—"} tone="bad" hint={counts ? `${counts.blank} blank · ${counts.invalid} invalid` : "OMR only"} />
        <KpiTile
          label="Rank"
          value={test.rank != null ? test.rank : "—"}
          hint={test.classSize != null ? `of ${test.classSize} in class` : "Published after OMR"}
        />
      </div>

      <div className="mt-4 space-y-4">
        {subjects.length > 0 && (
          <ChartPair barTitle="By subject" pieTitle="Marks by subject" bar={subjects} pie={share} pieUnit=" marks" />
        )}
        {mix.length > 0 && (
          <ChartPair barTitle="Right vs wrong" pieTitle="Answer mix" bar={mix} pie={mix} barKind="count" />
        )}

        <Panel title="Subject breakdown" description="Compared with your own average">
          <ul className="space-y-4">
            {subjects.map((row) => (
              <li key={row.subject}>
                <Meter label={row.name} value={row.score} max={row.max ?? 0} color="bg-brand-900" />
                <p className="mt-1 flex justify-between text-xs text-neutral-500">
                  <span>
                    {row.correct != null ? `${row.correct} correct` : null}
                    {row.wrong != null ? ` · ${row.wrong} wrong` : null}
                  </span>
                  {row.vsAvg != null && row.vsAvg !== 0 && (
                    <span className={row.vsAvg > 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                      {row.vsAvg > 0 ? "+" : ""}
                      {row.vsAvg}% vs avg
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
