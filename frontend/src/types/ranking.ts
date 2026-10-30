import type { Subject } from "@/types/school";

export type RankingMode = "test" | "overall";

export type RankingViewerKind = "admin" | "school" | "class-teacher" | "subject-teacher" | "student";

export type RankingSubjectScore = {
  subject: Subject;
  score: number | null;
  max: number | null;
};

export type RankingRow = {
  rank: number;
  studentId: string;
  name: string;
  rollNo: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  sectionName: string | null;
  tests: number;
  score: number | null;
  max: number | null;
  subjects: RankingSubjectScore[];
};

export type RankingReport = {
  viewer: {
    kind: RankingViewerKind;
    selfStudentId: string | null;
  };
  scope: {
    schoolId: string | null;
    schoolName: string | null;
    program: string | null;
    programName: string | null;
    classLevel: number | null;
    mode: RankingMode;
    testId: string | null;
    testNumber: number | null;
    testLabel: string | null;
  };
  filters: {
    schools: Array<{ id: string; name: string; code: string }>;
    programs: Array<{ code: string; name: string; hasScores: boolean }>;
    classes: Array<{ level: number; hasScores: boolean }>;
    ranked: Array<{ program: string; programName: string; classLevel: number }>;
    tests: Array<{ id: string; label: string; testNumber: number; latest: boolean }>;
  };
  subjects: Subject[];
  rows: RankingRow[];
};
