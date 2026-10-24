import { LiveRefresh } from "@/features/live/live-refresh";
import { ResultUnavailable } from "@/features/student-portal/result-unavailable";
import { loadStudentTests } from "@/features/student-portal/load";
import { StudentTestDetail } from "@/features/student-portal/student-test-detail";
import { percentOf } from "@/features/student-portal/types";
import type { Subject } from "@/types/school";

export default async function StudentTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const tests = await loadStudentTests();
  const test = tests.find((row) => row.testId === decodeURIComponent(testId));
  if (!test) {
    return (
      <>
        <LiveRefresh kind="results" as="student" />
        <ResultUnavailable />
      </>
    );
  }

  const sums = new Map<Subject, number[]>();
  for (const row of tests.flatMap((item) => item.subjects)) {
    const pct = percentOf(row.score, row.max);
    if (pct != null) sums.set(row.subject, [...(sums.get(row.subject) ?? []), pct]);
  }
  const average = Object.fromEntries(
    [...sums].map(([subject, values]) => [subject, values.reduce((a, b) => a + b, 0) / values.length]),
  ) as Partial<Record<Subject, number>>;

  return (
    <>
      <LiveRefresh kind="results" as="student" />
      <StudentTestDetail test={test} average={average} />
    </>
  );
}
