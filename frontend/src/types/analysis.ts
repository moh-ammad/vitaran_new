import type { Subject } from "@/types/school";

export type AnalysisSubjectStat = {
  subject: Subject;
  avgPercent: number;
  students: number;
  tests: number;
};

export type AnalysisGroupRow = {
  key: string;
  label: string;
  schoolId?: string;
  programCode?: string;
  classLevel?: number;
  sectionId?: string | null;
  testId?: string;
  testNumber?: number;
  students: number;
  tests: number;
  avgPercent: number | null;
  weakSubject: Subject | null;
};

export type AnalysisStudentRow = {
  studentId: string;
  name: string;
  rollNo: string;
  classLevel: number;
  sectionName: string | null;
  programName: string;
  tests: number;
  avgPercent: number | null;
  subjects: AnalysisSubjectStat[];
};

export type AnalysisReport = {
  scope: {
    schoolId: string | null;
    schoolName: string | null;
    program: string | null;
    classLevel: number | null;
    sectionId: string | null;
    sectionName: string | null;
    testId: string | null;
  };
  filters: {
    schools: Array<{ id: string; name: string; code: string }>;
    programs: Array<{ code: string; name: string }>;
    classes: number[];
    sections: Array<{ id: string; name: string }>;
    tests: Array<{ id: string; label: string }>;
  };
  totals: {
    schools: number;
    students: number;
    tests: number;
    avgPercent: number | null;
    weakSubject: Subject | null;
  };
  subjects: AnalysisSubjectStat[];
  schools: AnalysisGroupRow[];
  programs: AnalysisGroupRow[];
  classes: AnalysisGroupRow[];
  sections: AnalysisGroupRow[];
  tests: AnalysisGroupRow[];
  students: AnalysisStudentRow[];
};
