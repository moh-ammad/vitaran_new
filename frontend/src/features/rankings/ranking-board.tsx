"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { useLiveContent } from "@/features/live/use-live-content";
import { classLabel } from "@/utils/format";
import type { RankingReport } from "@/types/ranking";
import type { Subject } from "@/types/school";
import { loadRankingAction } from "./actions";
import { rankingFileHref, type RankingParams, type RankingRole } from "./query";

function formatMark(value: number | null | undefined) {
  if (value == null) return null;
  return Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.05
    ? String(Math.round(value))
    : value.toFixed(1);
}

function formatMarks(score: number | null | undefined) {
  return formatMark(score) ?? "—";
}

function sharedMax(values: Array<number | null | undefined>) {
  const nums = values.filter((value): value is number => value != null);
  if (nums.length === 0) return null;
  const first = nums[0]!;
  return nums.every((value) => value === first) ? first : null;
}

function subjectName(subject: Subject) {
  return SUBJECT_LABELS[subject] ?? subject;
}

function MarksHead({ label, max }: { label: string; max: number | null }) {
  const maxLabel = formatMark(max);
  return (
    <TableHead className="text-right">
      <span className="block">{label}</span>
      {maxLabel ? (
        <span className="block text-[10px] font-medium text-neutral-600">(max marks {maxLabel})</span>
      ) : null}
    </TableHead>
  );
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
  if (items.length === 0) return null;
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next as string)}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-9 rounded-lg border-neutral-200 bg-white text-sm text-neutral-700 shadow-none hover:border-brand-300",
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

export function RankingBoard({
  role,
  report: initialReport,
}: {
  role: RankingRole;
  report: RankingReport;
}) {
  const [report, setReport] = useState(initialReport);
  const [params, setParams] = useState<RankingParams>({
    school: initialReport.scope.schoolId,
    program: initialReport.scope.program,
    class: initialReport.scope.classLevel,
    mode: initialReport.scope.mode,
    test: initialReport.scope.testId,
  });
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const load = useCallback(
    (next: RankingParams) => {
      startTransition(async () => {
        setReport(await loadRankingAction(role, next));
      });
    },
    [role],
  );

  const go = (next: RankingParams) => {
    setParams(next);
    load(next);
  };

  useLiveContent("results", () => load(paramsRef.current), role === "admin" ? "admin" : role === "student" ? "student" : undefined);

  const { scope, filters, rows, subjects, viewer } = report;
  const locked = viewer.kind === "student";
  const canPickSchool = viewer.kind === "admin";
  const programItems = filters.programs.map((item) => ({
    value: item.code,
    label: item.hasScores ? `${programLabel(item.code, item.name)} · ranked` : programLabel(item.code, item.name),
  }));
  const classItems = filters.classes.map((item) => ({
    value: String(item.level),
    label: item.hasScores ? `${classLabel(item.level)} · ranked` : classLabel(item.level),
  }));
  const otherRanked = filters.ranked.filter(
    (item) => item.program !== scope.program || item.classLevel !== scope.classLevel,
  );
  const subjectMax = (subject: Subject) =>
    sharedMax(rows.map((row) => row.subjects.find((item) => item.subject === subject)?.max));
  const totalMax = sharedMax(rows.map((row) => row.max));
  const testItems = filters.tests.map((item) => ({ value: item.id, label: item.label }));
  const schoolItems = canPickSchool
    ? [
        { value: "ALL", label: "All schools" },
        ...filters.schools.map((item) => ({ value: item.id, label: `${capitalizeWords(item.name)} · ${item.code}` })),
      ]
    : filters.schools.map((item) => ({
        value: item.id,
        label: `${capitalizeWords(item.name)} · ${item.code}`,
      }));

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.rollNo.toLowerCase().includes(needle) ||
        row.schoolName.toLowerCase().includes(needle),
    );
  }, [rows, query]);

  const title =
    scope.mode === "overall"
      ? "Overall ranking"
      : scope.testLabel
        ? scope.testLabel
        : "Latest test";
  const description = [
    scope.schoolName ? capitalizeWords(scope.schoolName) : canPickSchool && !scope.schoolId ? "All schools" : null,
    scope.programName ? capitalizeWords(scope.programName) : null,
    scope.classLevel != null ? classLabel(scope.classLevel) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const fileParams: RankingParams = {
    school: scope.schoolId,
    program: scope.program,
    class: scope.classLevel,
    mode: scope.mode,
    test: scope.testId,
  };

  return (
    <div className={cn("space-y-4", pending && "opacity-70 transition-opacity")}>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="School"
          value={scope.schoolId ?? (canPickSchool ? "ALL" : "")}
          items={schoolItems}
          onChange={(value) => {
            if (!canPickSchool) return;
            go({
              ...params,
              school: value === "ALL" ? null : value,
              test: null,
            });
          }}
          className="min-w-52"
        />
        {!locked && (
          <>
            <FilterSelect
              label="Program"
              value={scope.program ?? ""}
              items={programItems}
              onChange={(value) => go({ ...params, program: value, class: null, test: null })}
              className="min-w-48"
            />
            <FilterSelect
              label="Class"
              value={scope.classLevel != null ? String(scope.classLevel) : ""}
              items={classItems}
              onChange={(value) => go({ ...params, class: Number(value), test: null })}
              className="min-w-32"
            />
          </>
        )}
        <div className="flex rounded-xl border border-brand-100 bg-white p-1">
          <button
            type="button"
            onClick={() => go({ ...params, mode: "test", test: filters.tests.find((item) => item.latest)?.id ?? params.test })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
              scope.mode === "test" ? "bg-brand-900 text-white" : "text-brand-800 hover:bg-brand-50",
            )}
          >
            This test
          </button>
          <button
            type="button"
            onClick={() => go({ ...params, mode: "overall", test: null })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
              scope.mode === "overall" ? "bg-brand-900 text-white" : "text-brand-800 hover:bg-brand-50",
            )}
          >
            Overall
          </button>
        </div>
        {scope.mode === "test" && (
          <FilterSelect
            label="Test"
            value={scope.testId ?? ""}
            items={testItems}
            onChange={(value) => go({ ...params, mode: "test", test: value })}
            className="min-w-56"
          />
        )}
        {role !== "student" && scope.program ? (
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-9 rounded-lg border-neutral-200 bg-white text-sm font-semibold text-neutral-700 shadow-none hover:border-brand-300"
                  />
                }
              >
                <Download />
                Download
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem render={<a href={rankingFileHref(role, fileParams, "xlsx")} />}>
                  <FileSpreadsheet />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem render={<a href={rankingFileHref(role, fileParams, "pdf")} />}>
                  <FileText />
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {filters.programs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-14 text-center">
          <p className="text-base font-semibold text-neutral-950">No rankings yet</p>
          <p className="max-w-md text-sm text-brand-700">
            Rankings appear here after a test is published for a program and class.
          </p>
        </div>
      ) : (
        <Panel title={title} description={description || "Pick a program and class"}>
          <div className="relative mb-4 max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, roll or school"
              className="h-9 rounded-lg border-neutral-200 bg-white pl-9"
            />
          </div>
          {visible.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">
                {query.trim()
                  ? "No students match that search."
                  : "No published scores for this program and class."}
              </p>
              {!query.trim() && otherRanked.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-neutral-800">Rankings are here:</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {otherRanked.map((item) => (
                      <button
                        key={`${item.program}:${item.classLevel}`}
                        type="button"
                        onClick={() => go({ ...params, program: item.program, class: item.classLevel, test: null })}
                        className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                      >
                        {programLabel(item.program, item.programName)} · {classLabel(item.classLevel)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Roll</TableHead>
                  {scope.mode === "overall" ? <TableHead className="text-right">Tests</TableHead> : null}
                  {subjects.map((subject) => (
                    <MarksHead key={subject} label={subjectName(subject)} max={subjectMax(subject)} />
                  ))}
                  <MarksHead label={scope.mode === "overall" ? "Avg total" : "Total"} max={totalMax} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => {
                  const mine = row.studentId === viewer.selfStudentId;
                  return (
                    <TableRow key={row.studentId} className={cn(mine && "bg-brand-50/80")}>
                      <TableCell className="font-semibold tabular-nums text-neutral-900">{row.rank}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-neutral-950">{capitalizeWords(row.name)}</p>
                        <p className="text-xs text-neutral-500">
                          {scope.classLevel != null ? classLabel(scope.classLevel) : "Class"}
                          {row.sectionName ? `-${row.sectionName}` : ""}
                          {mine ? " · You" : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {capitalizeWords(row.schoolName)}
                        </p>
                        <p className="font-mono text-[11px] text-neutral-500">{row.schoolCode}</p>
                      </TableCell>
                      <TableCell className="tabular-nums">{row.rollNo}</TableCell>
                      {scope.mode === "overall" ? (
                        <TableCell className="text-right tabular-nums">{row.tests}</TableCell>
                      ) : null}
                      {subjects.map((subject) => {
                        const hit = row.subjects.find((item) => item.subject === subject);
                        return (
                          <TableCell key={subject} className="text-right tabular-nums">
                            {formatMarks(hit?.score)}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-semibold tabular-nums">{formatMarks(row.score)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Panel>
      )}
    </div>
  );
}
