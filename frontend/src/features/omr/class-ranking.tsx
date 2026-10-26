import Link from "next/link";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import type { OmScan } from "@/types/om-scan";

function scopeKey(row: OmScan) {
  const subjects = row.subjectScores.map((s) => s.subject).sort().join(",");
  if (row.view === "class") {
    return `class:${row.student.classLevel}:${row.student.sectionName ?? ""}`;
  }
  return `subject:${row.student.classLevel}:${subjects}`;
}

function scopeTitle(row: OmScan) {
  const klass = `Class ${row.student.classLevel}${row.student.sectionName ? `-${row.student.sectionName}` : ""}`;
  if (row.view === "class") return klass;
  const subjects = row.subjectScores.map((s) => SUBJECT_LABELS[s.subject] ?? s.subject).join(" · ");
  return `${klass} · ${subjects || "your subjects"}`;
}

export function ClassRanking({ scans, testId }: { scans: OmScan[]; testId?: string }) {
  const rows = testId ? scans.filter((row) => row.testId === testId) : scans;
  if (rows.length === 0) return null;

  const groups = new Map<string, OmScan[]>();
  for (const row of rows) {
    const key = scopeKey(row);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return (
    <div className="space-y-4">
      {[...groups.values()].map((group) => {
        const sorted = [...group].sort(
          (a, b) => (a.rank ?? 999) - (b.rank ?? 999) || a.rollNo.localeCompare(b.rollNo),
        );
        const title = scopeTitle(sorted[0]!);
        return (
          <div key={scopeKey(sorted[0]!)} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <p className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              {title}
            </p>
            <ul className="divide-y divide-neutral-100 sm:hidden">
              {sorted.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/teacher/omr-scan/${row.id}`}
                    className="flex items-center gap-3 px-4 py-3 active:bg-neutral-50"
                  >
                    <span className="w-8 text-sm font-bold tabular-nums text-neutral-500">{row.rank ?? "—"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-brand-900">{row.student.name}</span>
                      <span className="text-xs text-neutral-500 tabular-nums">{row.rollNo}</span>
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {row.total}/{row.maxTotal}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <table className="hidden w-full text-sm sm:table">
              <thead className="bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Rank</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Roll</th>
                  <th className="px-4 py-2.5 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sorted.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2.5 font-bold tabular-nums">{row.rank ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/teacher/omr-scan/${row.id}`} className="font-semibold text-brand-900 hover:underline">
                        {row.student.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{row.rollNo}</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                      {row.total}/{row.maxTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
