import { SUBJECT_LABELS } from "@/features/schools/constants";
import { capitalizeWords } from "@/features/schools/schema";
import { cn } from "@/lib/utils";
import type { OmScan, OmScanResult } from "@/types/om-scan";

export function OmScorecard({ scan }: { scan: OmScan; read?: OmScanResult["read"] }) {
  const { student } = scan;
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:space-y-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-neutral-950 sm:text-xl">
            {capitalizeWords(student.name)}
          </h2>
          <p className="text-sm text-neutral-600">
            {student.rollNo} · {student.classLevel}
            {student.sectionName ? `-${student.sectionName}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold tabular-nums text-brand-900 sm:text-3xl">
            {scan.total}
            <span className="text-base font-semibold text-neutral-500">/{scan.maxTotal}</span>
          </p>
          {scan.rank != null && scan.classSize != null && (
            <p className="text-sm font-semibold text-neutral-700">
              Rank {scan.rank} of {scan.classSize}
            </p>
          )}
        </div>
      </div>
      <dl className={cn("grid gap-2 text-center text-sm", (scan.partial ?? 0) > 0 ? "grid-cols-4" : "grid-cols-3")}>
        <Stat label="Correct" value={scan.correct} />
        {(scan.partial ?? 0) > 0 ? <Stat label="Partial" value={scan.partial ?? 0} /> : null}
        <Stat label="Wrong" value={scan.wrong} />
        <Stat label="Blank" value={scan.blank} />
      </dl>
      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
        {scan.subjectScores.map((row) => (
          <li key={`${row.subject}-${row.from}`} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{SUBJECT_LABELS[row.subject]}</p>
              <p className="text-xs text-neutral-500">
                Q{row.from}–{row.to} · {row.correct} correct
              </p>
            </div>
            <p className="text-sm font-bold tabular-nums">
              {row.total}/{row.maxTotal}
            </p>
          </li>
        ))}
      </ul>
      {scan.flags.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            {scan.flags.length} question{scan.flags.length === 1 ? "" : "s"} not counted
          </p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {scan.flags.map((flag) => (
              <li key={flag.question}>
                Q{flag.question}: {flag.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-neutral-50 px-2 py-3">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}
