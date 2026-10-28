"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Panel } from "@/features/admin/dashboard-parts";
import { SUBJECT_LABELS, programLabel } from "@/features/schools/constants";
import { SUBJECT_COLORS } from "@/features/student-portal/subject-colors";
import { KpiTile, SubjectBarChart } from "@/features/student-portal/student-ui";
import { cn } from "@/lib/utils";
import type { AnalysisGroupRow, AnalysisReport, AnalysisStudentRow } from "@/types/analysis";
import type { Subject } from "@/types/school";
import { classLabel } from "@/utils/format";
import { analysisHref, type AnalysisParams } from "./query";

const ALL = "ALL";

function formatPct(value: number | null | undefined) {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function subjectName(subject: Subject) {
  return SUBJECT_LABELS[subject] ?? subject;
}

function FilterSelect({
  label,
  value,
  items,
  onChange,
  className,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const active = value !== ALL;
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next as string)}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-9 rounded-lg border-neutral-200 bg-white text-sm text-neutral-700 shadow-none hover:border-brand-300",
          active && "border-brand-300 bg-brand-50 font-medium text-brand-900",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GroupTable({
  title,
  description,
  rows,
  hrefFor,
}: {
  title: string;
  description: string;
  rows: AnalysisGroupRow[];
  hrefFor: (row: AnalysisGroupRow) => string;
}) {
  if (rows.length === 0) return null;
  return (
    <Panel title={title} description={description}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Students</TableHead>
            <TableHead className="text-right">Tests</TableHead>
            <TableHead className="text-right">Average</TableHead>
            <TableHead>Weakest</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} className="hover:bg-brand-50/70">
              <TableCell>
                <Link href={hrefFor(row)} className="font-semibold text-brand-900 hover:underline">
                  {row.label}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.students}</TableCell>
              <TableCell className="text-right tabular-nums">{row.tests}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatPct(row.avgPercent)}</TableCell>
              <TableCell>
                {row.weakSubject ? (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    {subjectName(row.weakSubject)}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function StudentTable({ rows }: { rows: AnalysisStudentRow[] }) {
  const [query, setQuery] = useState("");
  const subjects = useMemo(() => {
    const seen = new Set<Subject>();
    for (const row of rows) {
      for (const item of row.subjects) seen.add(item.subject);
    }
    return [...seen];
  }, [rows]);
  const filtered = rows.filter((row) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return row.name.toLowerCase().includes(needle) || row.rollNo.toLowerCase().includes(needle);
  });

  if (rows.length === 0) return null;

  return (
    <Panel title="Students" description="Latest OMR score wins when a student also has an uploaded sheet.">
      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or roll"
          className="h-9 rounded-lg border-neutral-200 bg-white pl-9"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Roll</TableHead>
            <TableHead className="text-right">Tests</TableHead>
            <TableHead className="text-right">Average</TableHead>
            {subjects.map((subject) => (
              <TableHead key={subject} className="text-right">
                {subjectName(subject)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow key={row.studentId}>
              <TableCell>
                <p className="font-semibold text-neutral-950">{row.name}</p>
                <p className="text-xs text-neutral-500">
                  {classLabel(row.classLevel)}
                  {row.sectionName ? `-${row.sectionName}` : ""} · {row.programName}
                </p>
              </TableCell>
              <TableCell className="tabular-nums">{row.rollNo}</TableCell>
              <TableCell className="text-right tabular-nums">{row.tests}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatPct(row.avgPercent)}</TableCell>
              {subjects.map((subject) => {
                const hit = row.subjects.find((item) => item.subject === subject);
                const weak = hit && row.subjects[0]?.subject === subject;
                return (
                  <TableCell
                    key={subject}
                    className={cn("text-right tabular-nums", weak && "font-semibold text-rose-700")}
                  >
                    {formatPct(hit?.avgPercent)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length === 0 && <p className="mt-3 text-sm text-neutral-500">No students match that search.</p>}
    </Panel>
  );
}

export function AnalysisBoard({
  role,
  basePath,
  report,
}: {
  role: "admin" | "school" | "teacher";
  basePath: string;
  report: AnalysisReport;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { scope, filters, totals } = report;

  const go = (params: AnalysisParams) => {
    startTransition(() => {
      router.replace(analysisHref(basePath, params), { scroll: false });
    });
  };

  const current: AnalysisParams = {
    school: role === "admin" ? scope.schoolId : undefined,
    program: scope.program,
    class: scope.classLevel,
    section: scope.sectionId,
    test: scope.testId,
  };

  const rootLabel = role === "admin" ? "All schools" : role === "teacher" ? "Your classes" : "All classes";
  const crumbs = [
    { label: rootLabel, href: basePath },
    ...(scope.schoolName && role === "admin"
      ? [{ label: scope.schoolName, href: analysisHref(basePath, { school: scope.schoolId }) }]
      : []),
    ...(scope.program
      ? [
          {
            label: programLabel(scope.program),
            href: analysisHref(basePath, { school: current.school, program: scope.program }),
          },
        ]
      : []),
    ...(scope.classLevel
      ? [
          {
            label: classLabel(scope.classLevel),
            href: analysisHref(basePath, {
              school: current.school,
              program: scope.program,
              class: scope.classLevel,
            }),
          },
        ]
      : []),
    ...(scope.sectionName
      ? [
          {
            label: scope.sectionName,
            href: analysisHref(basePath, { ...current, test: null, section: scope.sectionId }),
          },
        ]
      : []),
    ...(scope.testId
      ? [
          {
            label: filters.tests.find((item) => item.id === scope.testId)?.label ?? scope.testId,
            href: analysisHref(basePath, current),
          },
        ]
      : []),
  ];

  const empty =
    totals.students === 0 &&
    report.schools.length === 0 &&
    report.classes.length === 0 &&
    report.tests.length === 0 &&
    report.students.length === 0;

  const chart = report.subjects.map((item) => ({
    name: subjectName(item.subject),
    value: item.avgPercent,
    fill: SUBJECT_COLORS[item.subject] ?? "#191c5f",
  }));

  return (
    <div className={cn("space-y-5", pending && "opacity-70 transition-opacity")}>
      <div className="flex flex-wrap items-center gap-2">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href + crumb.label} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="size-3.5 text-neutral-400" />}
            {index === crumbs.length - 1 ? (
              <span className="text-sm font-semibold text-neutral-900">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-sm font-medium text-brand-800 hover:underline">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {role === "admin" && filters.schools.length > 0 && (
          <FilterSelect
            label="School"
            value={scope.schoolId ?? ALL}
            items={[
              { value: ALL, label: "All schools" },
              ...filters.schools.map((school) => ({ value: school.id, label: school.name })),
            ]}
            onChange={(value) => go({ school: value === ALL ? null : value })}
            className="min-w-48"
          />
        )}
        {(role !== "admin" || scope.schoolId) && filters.programs.length > 0 && (
          <FilterSelect
            label="Program"
            value={scope.program ?? ALL}
            items={[
              { value: ALL, label: "All programs" },
              ...filters.programs.map((program) => ({
                value: program.code,
                label: programLabel(program.code, program.name),
              })),
            ]}
            onChange={(value) =>
              go({
                school: current.school,
                program: value === ALL ? null : value,
              })
            }
            className="min-w-44"
          />
        )}
        {(role !== "admin" || scope.schoolId) && filters.classes.length > 0 && (
          <FilterSelect
            label="Class"
            value={scope.classLevel != null ? String(scope.classLevel) : ALL}
            items={[
              { value: ALL, label: "All classes" },
              ...filters.classes.map((level) => ({ value: String(level), label: classLabel(level) })),
            ]}
            onChange={(value) =>
              go({
                school: current.school,
                program: current.program,
                class: value === ALL ? null : value,
              })
            }
            className="min-w-36"
          />
        )}
        {scope.classLevel != null && filters.sections.length > 1 && (
          <FilterSelect
            label="Section"
            value={scope.sectionId ?? ALL}
            items={[
              { value: ALL, label: "All sections" },
              ...filters.sections.map((section) => ({ value: section.id, label: section.name })),
            ]}
            onChange={(value) =>
              go({
                school: current.school,
                program: current.program,
                class: current.class,
                section: value === ALL ? null : value,
              })
            }
            className="min-w-36"
          />
        )}
        {filters.tests.length > 1 && (
          <FilterSelect
            label="Test"
            value={scope.testId ?? ALL}
            items={[
              { value: ALL, label: "All tests" },
              ...filters.tests.map((test) => ({ value: test.id, label: test.label })),
            ]}
            onChange={(value) =>
              go({
                school: current.school,
                program: current.program,
                class: current.class,
                section: current.section,
                test: value === ALL ? null : value,
              })
            }
            className="min-w-44"
          />
        )}
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-14 text-center">
          <p className="text-base font-semibold text-neutral-950">No scores yet</p>
          <p className="max-w-md text-sm text-brand-700">
            Analysis uses the latest OMR scans and uploaded sheets. OMR wins when both exist for the same
            student and test.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile label="Average" value={formatPct(totals.avgPercent)} hint="Across the latest test scores" tone="brand" />
            <KpiTile label="Students" value={totals.students} hint={role === "admin" ? `${totals.schools} schools` : "In this view"} />
            <KpiTile label="Tests" value={totals.tests} hint="OMR scans and uploaded sheets" />
            <KpiTile
              label="Weakest subject"
              value={totals.weakSubject ? subjectName(totals.weakSubject) : "—"}
              hint="Lowest average in this view"
              tone={totals.weakSubject ? "bad" : "default"}
            />
          </div>

          {chart.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <Panel title="Subject performance" description="Lowest average first — those subjects need more work.">
                <SubjectBarChart data={chart} />
              </Panel>
              <Panel title="Where students are weak" description="Average percent by subject.">
                <ul className="space-y-3">
                  {report.subjects.map((item, index) => (
                    <li key={item.subject}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-neutral-900">
                          {subjectName(item.subject)}
                          {index === 0 && (
                            <span className="ml-2 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-rose-700 uppercase">
                              Weakest
                            </span>
                          )}
                        </span>
                        <span className="font-semibold tabular-nums text-neutral-900">{formatPct(item.avgPercent)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, item.avgPercent)}%`,
                            background: SUBJECT_COLORS[item.subject] ?? "#191c5f",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}

          <GroupTable
            title="Schools"
            description="Open a school for class, section, and program breakdowns."
            rows={report.schools}
            hrefFor={(row) => analysisHref(basePath, { school: row.schoolId })}
          />
          <GroupTable
            title="Programs"
            description="How each program is performing in this school."
            rows={report.programs}
            hrefFor={(row) =>
              analysisHref(basePath, { school: current.school, program: row.programCode })
            }
          />
          <GroupTable
            title="Classes"
            description="Class-wise averages. Open a class for sections and students."
            rows={report.classes}
            hrefFor={(row) =>
              analysisHref(basePath, {
                school: current.school,
                program: current.program,
                class: row.classLevel,
              })
            }
          />
          <GroupTable
            title="Sections"
            description="Section-wise averages for this class."
            rows={report.sections}
            hrefFor={(row) =>
              analysisHref(basePath, {
                school: current.school,
                program: current.program,
                class: current.class,
                section: row.sectionId ?? "none",
              })
            }
          />
          <GroupTable
            title="Tests"
            description="How the class moved from one test to the next. Open a test for student-wise scores."
            rows={report.tests}
            hrefFor={(row) =>
              analysisHref(basePath, {
                school: current.school,
                program: current.program,
                class: current.class,
                section: current.section,
                test: row.testId,
              })
            }
          />
          <StudentTable rows={report.students} />
        </>
      )}
    </div>
  );
}
