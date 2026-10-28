"use client";

import { useMemo, useState } from "react";
import { LiveRefresh } from "@/features/live/live-refresh";
import { ClassRanking } from "./class-ranking";
import { OmrScanner } from "./omr-scanner";
import { ReleasePanel } from "./release-panel";
import { OmScorecard } from "./scorecard";
import type { OmResultRelease, OmScan, OmScanResult } from "@/types/om-scan";

export function OmrScanBoard({ initial, releases }: { initial: OmScan[]; releases: OmResultRelease[] }) {
  const [scans, setScans] = useState(initial);
  const [latest, setLatest] = useState<OmScan | null>(null);
  const [latestRead, setLatestRead] = useState<OmScanResult["read"]>();

  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setScans(initial);
  }

  const tests = useMemo(() => [...new Set(scans.map((row) => row.testId))], [scans]);
  const [testId, setTestId] = useState(tests[0] ?? "");
  const canScan = releases.length > 0 || scans.some((row) => row.view === "class");

  function onScanned(result: OmScanResult) {
    setLatest(result.scan);
    setLatestRead(result.read);
    setScans((prev) => {
      const next = prev.filter(
        (row) =>
          row.id !== result.scan.id &&
          !(row.student.id === result.scan.student.id && row.testId === result.scan.testId),
      );
      return [result.scan, ...next];
    });
    setTestId(result.scan.testId);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <LiveRefresh kind="results" />
      <ReleasePanel releases={releases} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <OmrScanner onScanned={onScanned} />
        <div className="min-w-0 space-y-4">
          {latest && <OmScorecard scan={latest} read={latestRead} />}
          {tests.length > 1 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {tests.map((id) => {
                const sample = scans.find((row) => row.testId === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTestId(id)}
                    className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold ${
                      testId === id ? "border-brand-900 bg-brand-900 text-white" : "border-neutral-200 bg-white"
                    }`}
                  >
                    {sample ? `Test ${sample.testNumber} · ${id}` : id}
                  </button>
                );
              })}
            </div>
          )}
          {scans.length === 0 && !canScan ? null : (
            <ClassRanking scans={scans} testId={testId || undefined} />
          )}
        </div>
      </div>
    </div>
  );
}
