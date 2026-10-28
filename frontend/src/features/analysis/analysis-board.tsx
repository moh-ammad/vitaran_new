"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { capitalizeWords } from "@/features/schools/schema";
import { SUBJECT_COLORS } from "@/features/student-portal/subject-colors";
import { cn } from "@/lib/utils";
import { ChartPair, KpiTile, SubjectBarChart } from "@/features/student-portal/student-ui";
import type { AnalysisGroupRow, AnalysisReport, AnalysisStudentFocus, AnalysisStudentRow } from "@/types/analysis";
import type { Subject } from "@/types/school";
import { useLiveContent } from "@/features/live/use-live-content";
import { classLabel } from "@/utils/format";
import { loadAnalysisAction } from "./actions";
import type { AnalysisParams } from "./query";

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
  onOpen,
}: {
  title: string;
  description: string;
  rows: AnalysisGroupRow[];
  onOpen: (row: AnalysisGroupRow) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <Panel title={title} description={description}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Rank</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Students</TableHead>
            <TableHead className="text-right">Tests</TableHead>
            <TableHead className="text-right">Est. average</TableHead>
            <TableHead>Improve in</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.key} className="hover:bg-brand-50/70">
              <TableCell className="font-semibold tabular-nums text-neutral-900">{index + 1}</TableCell>
              <TableCell>
                <button type="button" onClick={() => onOpen(row)} className="font-semibold text-brand-900 hover:underline">
                  {row.label}
                </button>
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

function StudentTable({
  rows,
  onOpen,
}: {
  rows: AnalysisStudentRow[];
  onOpen: (row: AnalysisStudentRow) => void;
}) {
  const [query, setQuery] = useState("");
  const subjects = useMemo(() => {
    const seen = new Set<Subject>();
    for (const row of rows) {
      for (const item of row.subjects) seen.add(item.subject);
    }
    return [...seen];
  }, [rows]);
  if (rows.length === 0) return null;

  const ranked = rows.map((row, index) => ({ row, rank: index + 1 }));
  const visible = ranked.filter(({ row }) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return row.name.toLowerCase().includes(needle) || row.rollNo.toLowerCase().includes(needle);
  });

  return (
    <Panel title="Students" description="Ranked by estimated average. The subject to improve is named on each row.">
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
            <TableHead className="w-14">Rank</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Roll</TableHead>
            <TableHead className="text-right">Tests</TableHead>
            <TableHead className="text-right">Est. average</TableHead>
            <TableHead>Improve in</TableHead>
            {subjects.map((subject) => (
              <TableHead key={subject} className="text-right">
                {subjectName(subject)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map(({ row, rank }) => (
            <TableRow key={row.studentId} className="hover:bg-brand-50/70">
              <TableCell className="font-semibold tabular-nums text-neutral-900">{rank}</TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onOpen(row)}
                  className="font-semibold text-brand-900 hover:underline"
                >
                  {capitalizeWords(row.name)}
                </button>
                <p className="text-xs text-neutral-500">
                  {classLabel(row.classLevel)}
                  {row.sectionName ? `-${row.sectionName}` : ""} · {row.programName}
                </p>
              </TableCell>
              <TableCell className="tabular-nums">{row.rollNo}</TableCell>
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
              {subjects.map((subject) => {
                const hit = row.subjects.find((item) => item.subject === subject);
                const weak = hit && (row.weakSubject ?? row.subjects[0]?.subject) === subject;
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
      {visible.length === 0 && <p className="mt-3 text-sm text-neutral-500">No students match that search.</p>}
    </Panel>
  );
}

const TEST_FILLS = ["#191c5f", "#3b3f8f", "#5b61b5", "#38bdf8", "#15803d", "#a16207"];

function StudentFocus({ student }: { student: AnalysisStudentFocus }) {
  const testBar = student.tests
    .filter((row) => row.percent != null)
    .map((row, index) => ({
      name: `Test ${row.testNumber}`,
      value: row.percent ?? 0,
      fill: TEST_FILLS[index % TEST_FILLS.length] ?? "#191c5f",
    }));
  const subjectBar = student.subjects.map((item) => ({
    name: subjectName(item.subject),
    value: item.avgPercent,
    fill: SUBJECT_COLORS[item.subject] ?? "#191c5f",
  }));
  const subjectPie = student.subjects.map((item) => ({
    name: subjectName(item.subject),
    value: item.avgPercent,
    fill: SUBJECT_COLORS[item.subject] ?? "#191c5f",
  }));

  const weak = student.subjects.find((item) => item.subject === student.weakSubject);

  return (
    <div className="space-y-4">
      {student.weakSubject && (
        <Panel title="Focus subject" description="Where extra practice will help most.">
          <p className="text-2xl font-bold text-brand-900">
            {capitalizeWords(student.name)} needs to improve in {subjectName(student.weakSubject)}
          </p>
          {weak ? (
            <p className="mt-1 text-sm text-neutral-600">
              Average in this subject is {formatPct(weak.avgPercent)}.
            </p>
          ) : null}
        </Panel>
      )}
      {testBar.length > 0 && subjectPie.length > 0 && (
        <ChartPair barTitle="Score by test" pieTitle="Average by subject" bar={testBar} pie={subjectPie} />
      )}
      {subjectBar.length > 0 && (
        <Panel title="Subject performance" description="Lowest average first — those subjects need more work.">
          <SubjectBarChart data={subjectBar} />
        </Panel>
      )}
      <Panel title="Tests" description={`${student.tests.length} ${student.tests.length === 1 ? "test" : "tests"} for this student.`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test</TableHead>
              <TableHead className="text-right">Average</TableHead>
              {student.subjects.map((item) => (
                <TableHead key={item.subject} className="text-right">
                  {subjectName(item.subject)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {student.tests.map((row) => (
              <TableRow key={row.testId}>
                <TableCell>
                  <p className="font-semibold text-neutral-950">Test {row.testNumber}</p>
                  <p className="text-xs text-neutral-500">ID {row.testId}</p>
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatPct(row.percent)}</TableCell>
                {student.subjects.map((item) => {
                  const hit = row.subjects.find((score) => score.subject === item.subject);
                  return (
                    <TableCell key={item.subject} className="text-right tabular-nums">
                      {formatPct(hit?.percent)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

export function AnalysisBoard({
  role,
  report: initialReport,
}: {
  role: "admin" | "school" | "teacher";
  report: AnalysisReport;
}) {
  const [report, setReport] = useState(initialReport);
  const [params, setParams] = useState<AnalysisParams>({});
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const [pending, startTransition] = useTransition();
  const { scope, filters, totals } = report;

  const load = useCallback(
    (next: AnalysisParams) => {
      startTransition(async () => {
        setReport(await loadAnalysisAction(role, next));
      });
    },
    [role],
  );

  const go = (next: AnalysisParams) => {
    setParams(next);
    load(next);
  };

  useLiveContent(
    "results",
    () => load(paramsRef.current),
    role === "admin" ? "admin" : undefined,
  );

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const current: AnalysisParams = {
    school: role === "admin" ? scope.schoolId : undefined,
    program: scope.program,
    class: scope.classLevel,
    section: scope.sectionId,
    test: scope.testId,
    student: scope.studentId,
  };
  const studentView = Boolean(scope.studentId);

  const rootLabel = role === "admin" ? "All schools" : role === "teacher" ? "Your classes" : "All classes";
  type Crumb = { label: string; params?: AnalysisParams };
  const crumbs: Crumb[] = studentView
    ? [
        { label: rootLabel, params: {} },
        ...(scope.schoolName && role === "admin"
          ? [{ label: scope.schoolName, params: { school: scope.schoolId } }]
          : []),
        { label: scope.studentName ?? "Student", params: { school: current.school, student: scope.studentId } },
        ...(scope.testId
          ? [
              {
                label: filters.tests.find((item) => item.id === scope.testId)?.label ?? scope.testId,
                params: { school: current.school, student: scope.studentId, test: scope.testId },
              },
            ]
          : []),
      ]
    : [
        { label: rootLabel, params: {} },
        ...(scope.schoolName && role === "admin"
          ? [{ label: scope.schoolName, params: { school: scope.schoolId } }]
          : []),
        ...(scope.program
          ? [{ label: programLabel(scope.program), params: { school: current.school, program: scope.program } }]
          : []),
        ...(scope.classLevel
          ? [
              {
                label: classLabel(scope.classLevel),
                params: { school: current.school, program: scope.program, class: scope.classLevel },
              },
            ]
          : []),
        ...(scope.sectionName
          ? [
              {
                label: scope.sectionName,
                params: {
                  school: current.school,
                  program: current.program,
                  class: current.class,
                  section: scope.sectionId,
                },
              },
            ]
          : []),
        ...(scope.testId
          ? [
              {
                label: filters.tests.find((item) => item.id === scope.testId)?.label ?? scope.testId,
                params: { ...current, student: null },
              },
            ]
          : []),
      ];

  const empty =
    !report.focus &&
    totals.students === 0 &&
    report.schools.length === 0 &&
    report.programs.length === 0 &&
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
          <span key={crumb.label + index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="size-3.5 text-neutral-400" />}
            {index === crumbs.length - 1 ? (
              <span className="text-sm font-semibold text-neutral-900">{crumb.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => crumb.params && go(crumb.params)}
                className="text-sm font-medium text-brand-800 hover:underline"
              >
                {crumb.label}
              </button>
            )}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {!studentView && role === "admin" && filters.schools.length > 0 && (
          <FilterSelect
            label="School"
            value={scope.schoolId ?? ALL}
            items={[
              { value: ALL, label: "All schools" },
              ...filters.schools.map((school) => ({ value: school.id, label: school.name })),
            ]}
            onChange={(value) =>
              go({
                school: value === ALL ? null : value,
                program: current.program,
                class: current.class,
              })
            }
            className="min-w-48"
          />
        )}
        {!studentView && filters.programs.length > 0 && (
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
        {!studentView && filters.classes.length > 0 && (
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
        {!studentView && scope.classLevel != null && filters.sections.length > 1 && (
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
              studentView
                ? go({
                    school: current.school,
                    student: current.student,
                    test: value === ALL ? null : value,
                  })
                : go({
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
            Analysis uses published test scores. When a sheet and a scan exist for the same student and
            test, the scan is used.
          </p>
        </div>
      ) : (
        <>
          <div className={cn("grid gap-3 sm:grid-cols-2", report.focus ? "xl:grid-cols-3" : "xl:grid-cols-4")}>
            <KpiTile
              label="Estimated average"
              value={formatPct(totals.avgPercent)}
              hint={
                report.focus
                  ? `${report.focus.name} · roll ${report.focus.rollNo}`
                  : role === "admin" && !scope.schoolId
                    ? "Across all schools in this program / class view"
                    : "Across tests in this view"
              }
              tone="brand"
            />
            {!report.focus && (
              <KpiTile
                label="Students"
                value={totals.students}
                hint={role === "admin" ? `${totals.schools} schools` : "In this view"}
              />
            )}
            <KpiTile label="Tests" value={totals.tests} hint="Published tests in this view" />
            <KpiTile
              label="Focus subject"
              value={totals.weakSubject ? subjectName(totals.weakSubject) : "—"}
              hint={report.focus ? "Needs more practice" : "Needs more practice in this view"}
              tone="brand"
            />
          </div>

          {report.focus ? (
            <StudentFocus student={report.focus} />
          ) : (
            chart.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <Panel title="Subject performance" description="Lowest average first — those subjects need more work.">
                <SubjectBarChart data={chart} />
              </Panel>
              <Panel title="Where to improve" description="Average percent by subject.">
                <ul className="space-y-3">
                  {report.subjects.map((item, index) => (
                    <li key={item.subject}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-neutral-900">
                          {subjectName(item.subject)}
                          {index === 0 && (
                            <span className="ml-2 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-rose-700 uppercase">
                              Focus
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
            )
          )}

          <GroupTable
            title="Schools"
            description="Estimated average across schools. Filter by program or class to see who performed well."
            rows={report.schools}
            onOpen={(row) => go({ school: row.schoolId })}
          />
          <GroupTable
            title="Programs"
            description={
              role === "admin" && !scope.schoolId
                ? "Estimated average by program across all schools."
                : "Program-wise results. Open a program, or a class below."
            }
            rows={report.programs}
            onOpen={(row) => go({ school: current.school, program: row.programCode })}
          />
          <GroupTable
            title="Classes"
            description={
              role === "admin" && !scope.schoolId
                ? "Estimated average by class across all schools. Open a class to compare schools."
                : "Class-wise ranking and estimated average. Open a class for student ranking."
            }
            rows={report.classes}
            onOpen={(row) =>
              go({
                school: current.school,
                program: current.program ?? row.programCode,
                class: row.classLevel,
              })
            }
          />
          <GroupTable
            title="Sections"
            description="Section-wise averages for the classes in this view."
            rows={report.sections}
            onOpen={(row) =>
              go({
                school: current.school,
                program: current.program,
                class: current.class,
                section: row.sectionId ?? "none",
              })
            }
          />
          <StudentTable
            rows={report.students}
            onOpen={(row) => go({ school: current.school, student: row.studentId })}
          />
        </>
      )}
    </div>
  );
}
