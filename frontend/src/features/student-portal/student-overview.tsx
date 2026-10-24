"use client";

import Link from "next/link";
import { BookOpen, ChartPie, ListChecks, Trophy } from "lucide-react";
import { PageHeader } from "@/features/admin/page-header";
import { Panel, StatCard } from "@/features/admin/dashboard-parts";
import { ChipRow, QuickLinks } from "@/features/admin/quick-links";
import { capitalizeWords } from "@/features/schools/schema";
import type { StudentAccount } from "@/types/student";
import { StudentEmpty } from "./student-ui";
import { formatDate, reviewHref, testHref, testLabel, type StudentTest } from "./types";

export function StudentOverview({ student, tests }: { student: StudentAccount; tests: StudentTest[] }) {
  const firstName = capitalizeWords(student.name.split(/\s+/)[0] ?? student.name);
  const classLabel = `Class ${student.classLevel}${student.sectionName ? `-${student.sectionName}` : ""}`;
  const latest = [...tests].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.testNumber - a.testNumber)[0] ?? null;
  const omrCount = tests.filter((test) => test.source === "omr").length;

  const links = [
    {
      label: "Results",
      href: "/student/results",
      icon: Trophy,
      count: tests.length,
      hint: tests.length === 1 ? "1 published test" : `${tests.length} published tests`,
    },
    {
      label: "Analysis",
      href: "/student/analysis",
      icon: ChartPie,
      hint: "Right vs wrong, past vs latest",
    },
    {
      label: "Resources",
      href: "/student/resources",
      icon: BookOpen,
      hint: "Solution books",
    },
  ] as const;

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName}`}
        description={`${student.school.name} · ${student.school.code}`}
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ChipRow title="Class" items={[classLabel]} empty="No class assigned." />
          <ChipRow title="Roll no." items={[student.rollNo]} empty="—" />
          <ChipRow title="Program" items={[student.programName]} empty="No program assigned." />
        </div>
      </section>

      <div className="mt-4 md:hidden">
        <QuickLinks items={[...links]} className="grid-cols-2" />
      </div>

      <div className="mt-4 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
        {links.map((item) => (
          <StatCard
            key={item.href}
            label={item.label}
            value={"count" in item ? item.count : undefined}
            hint={item.hint}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>

      <div className="mt-4">
        {latest ? (
          <Panel
            title="Latest test"
            description={omrCount ? `${omrCount} OMR scan${omrCount === 1 ? "" : "s"} published` : "From published result sheets"}
            action={
              latest.source === "omr" ? (
                <Link
                  href={reviewHref(latest)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-900"
                >
                  <ListChecks className="size-4" />
                  See explanations
                </Link>
              ) : null
            }
          >
            <Link
              href={testHref(latest)}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-4 transition-colors hover:border-brand-900 hover:bg-brand-50"
            >
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-900 text-white">
                  <span className="text-[8px] font-semibold tracking-wider text-white/70 uppercase">No</span>
                  <span className="text-lg leading-none font-bold tabular-nums">{latest.testNumber}</span>
                </span>
                <div>
                  <p className="text-base font-bold text-neutral-950">{testLabel(latest)}</p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    ID {latest.testId} · {formatDate(latest.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-brand-900">
                  {latest.total ?? "—"}
                  {latest.maxTotal != null ? (
                    <span className="text-sm font-semibold text-neutral-400">/{latest.maxTotal}</span>
                  ) : null}
                </p>
                {latest.percentage != null && (
                  <p className="text-xs font-semibold text-neutral-600">{latest.percentage}%</p>
                )}
              </div>
            </Link>
          </Panel>
        ) : (
          <StudentEmpty
            title="No results yet"
            hint="Your class teacher publishes results after the test. They appear here as soon as they are pushed."
          />
        )}
      </div>
    </>
  );
}
