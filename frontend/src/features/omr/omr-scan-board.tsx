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
      const next = prev.filter((row) => row.id !== result.scan.id && !(row.student.id === result.scan.student.id && row.testId === result.scan.testId));
      return [result.scan, ...next];
    });
    setTestId(result.scan.testId);
  }

  return (
    <div className="space-y-6">
      <LiveRefresh kind="results" />
      <ReleasePanel releases={releases} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <OmrScanner onScanned={onScanned} />
        <div className="space-y-4">
          {latest && <OmScorecard scan={latest} read={latestRead} />}
          {tests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tests.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTestId(id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    testId === id ? "border-brand-900 bg-brand-900 text-white" : "border-neutral-200 bg-white"
                  }`}
                >
                  Test {id}
                </button>
              ))}
            </div>
          )}
          {scans.length === 0 && !canScan ? (
            <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
              Results appear here once the class teacher pushes them.
            </p>
          ) : (
            <ClassRanking scans={scans} testId={testId || undefined} />
          )}
        </div>
      </div>
    </div>
  );
}
