import type { Subject } from "@/types/school";

/** One test as the student sees it, from an uploaded result sheet or a published OMR scan. */
export type StudentTest = {
  key: string;
  testId: string;
  testNumber: number;
  /** YYYY-MM-DD: exam date for OMR scans, publish date for uploaded sheets. */
  date: string | null;
  source: "omr" | "sheet";
  programName: string;
  classLevel: number;
  sectionName: string | null;
  subjects: Array<{
    subject: Subject;
    score: number;
    max: number | null;
    correct?: number;
    wrong?: number;
    blank?: number;
  }>;
  total: number | null;
  maxTotal: number | null;
  percentage: number | null;
  /** OMR only. */
  counts: { correct: number; wrong: number; blank: number; invalid: number } | null;
  rank: number | null;
  classSize: number | null;
};

export function testHref(test: Pick<StudentTest, "testId">) {
  return `/student/results/${encodeURIComponent(test.testId)}`;
}

export function reviewHref(test: Pick<StudentTest, "testId">) {
  return `${testHref(test)}/review`;
}

export function percentOf(score: number, max: number | null) {
  if (!max) return null;
  return Math.round((score / max) * 1000) / 10;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function testLabel(test: Pick<StudentTest, "testNumber" | "testId">) {
  return test.testNumber > 0 && test.testNumber < 10_000 ? `Test ${test.testNumber}` : `Test ${test.testId}`;
}

/** Oldest first; date, then test number. */
export function byDate(a: StudentTest, b: StudentTest) {
  return (a.date ?? "").localeCompare(b.date ?? "") || a.testNumber - b.testNumber;
}
