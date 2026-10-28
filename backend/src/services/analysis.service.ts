import { SchoolStatus, type Subject } from "../generated/prisma/enums.js";
import * as omScanRepository from "../repositories/om-scan.repository.js";
import * as resultRepository from "../repositories/result.repository.js";
import * as schoolRepository from "../repositories/school.repository.js";
import * as studentRepository from "../repositories/student.repository.js";
import type { AnalysisQuery } from "../schemas/analysis.schema.js";
import type { CellValue } from "../utils/excel.js";
import type { SubjectScore } from "../utils/omr-score.js";
import {
  matchRosterStudent,
  parseScoreRow,
  type RosterStudent,
} from "../utils/result-sheet-scope.js";
import { assignedSubjects, isClassTeacherOf } from "./content-access.js";
import type { TeacherAccountDto } from "./teacher.service.js";

const WHOLE_CLASS = "none";

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

export type AnalysisActor =
  | { kind: "school"; schoolId: string }
  | { kind: "teacher"; teacher: TeacherAccountDto };

type Attempt = {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  studentId: string;
  name: string;
  rollNo: string;
  programId: string;
  programCode: string;
  programName: string;
  classLevel: number;
  sectionId: string | null;
  sectionName: string | null;
  testId: string;
  testNumber: number;
  source: "omr" | "upload";
  published: boolean;
  subjects: Array<{ subject: Subject; score: number; max: number | null }>;
  percent: number | null;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function percentOf(score: number | null, max: number | null) {
  if (score == null || max == null || max <= 0) return null;
  return round1((score / max) * 100);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function attemptKey(row: Pick<Attempt, "schoolId" | "studentId" | "testId">) {
  return `${row.schoolId}:${row.studentId}:${row.testId}`;
}

function subjectStats(attempts: Attempt[]): AnalysisSubjectStat[] {
  const buckets = new Map<Subject, { percents: number[]; students: Set<string>; tests: Set<string> }>();
  for (const attempt of attempts) {
    for (const item of attempt.subjects) {
      const percent = percentOf(item.score, item.max);
      if (percent == null) continue;
      const bucket = buckets.get(item.subject) ?? { percents: [], students: new Set(), tests: new Set() };
      bucket.percents.push(percent);
      bucket.students.add(attempt.studentId);
      bucket.tests.add(attempt.testId);
      buckets.set(item.subject, bucket);
    }
  }
  return [...buckets.entries()]
    .map(([subject, bucket]) => ({
      subject,
      avgPercent: average(bucket.percents) ?? 0,
      students: bucket.students.size,
      tests: bucket.tests.size,
    }))
    .sort((a, b) => a.avgPercent - b.avgPercent);
}

function weakSubjectOf(stats: AnalysisSubjectStat[]) {
  return stats[0]?.subject ?? null;
}

function groupRows(
  attempts: Attempt[],
  keyOf: (row: Attempt) => string,
  labelOf: (row: Attempt) => string,
  extra: (row: Attempt) => Partial<AnalysisGroupRow>,
): AnalysisGroupRow[] {
  const groups = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const key = keyOf(attempt);
    const list = groups.get(key);
    if (list) list.push(attempt);
    else groups.set(key, [attempt]);
  }
  return [...groups.entries()]
    .map(([key, rows]) => {
      const percents = rows.map((row) => row.percent).filter((value): value is number => value != null);
      const sample = rows[0];
      return {
        key,
        label: sample ? labelOf(sample) : key,
        students: new Set(rows.map((row) => row.studentId)).size,
        tests: new Set(rows.map((row) => row.testId)).size,
        avgPercent: average(percents),
        weakSubject: weakSubjectOf(subjectStats(rows)),
        ...(sample ? extra(sample) : {}),
      };
    })
    .sort((a, b) => (a.avgPercent ?? 101) - (b.avgPercent ?? 101));
}

function studentRows(attempts: Attempt[]): AnalysisStudentRow[] {
  const groups = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const list = groups.get(attempt.studentId);
    if (list) list.push(attempt);
    else groups.set(attempt.studentId, [attempt]);
  }
  return [...groups.values()]
    .map((rows) => {
      const sample = rows[0]!;
      const percents = rows.map((row) => row.percent).filter((value): value is number => value != null);
      return {
        studentId: sample.studentId,
        name: sample.name,
        rollNo: sample.rollNo,
        classLevel: sample.classLevel,
        sectionName: sample.sectionName,
        programName: sample.programName,
        tests: new Set(rows.map((row) => row.testId)).size,
        avgPercent: average(percents),
        subjects: subjectStats(rows),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function matchesProgram(attempt: Attempt, program: string) {
  return attempt.programCode === program || attempt.programName === program;
}

function releaseSlot(row: Attempt) {
  return [row.testId, row.programId, row.classLevel, row.sectionId ?? "class"].join(":");
}

function withSubjects(attempt: Attempt, subjects: Subject[]): Attempt {
  const next = attempt.subjects.filter((item) => subjects.includes(item.subject));
  const percents = next
    .map((item) => percentOf(item.score, item.max))
    .filter((value): value is number => value != null);
  return { ...attempt, subjects: next, percent: average(percents) };
}

async function forTeacher(attempts: Attempt[], teacher: TeacherAccountDto): Promise<Attempt[]> {
  const releases = await omScanRepository.findOmResultReleases({
    schoolId: teacher.schoolId,
    published: true,
  });
  const released = new Set(
    releases.map((row) => [row.testId, row.programId, row.classLevel, row.sectionKey].join(":")),
  );
  const visible: Attempt[] = [];
  for (const attempt of attempts) {
    if (attempt.schoolId !== teacher.schoolId) continue;
    const slot = {
      programCode: attempt.programCode,
      classLevel: attempt.classLevel,
      sectionId: attempt.sectionId,
    };
    const classTeacher = isClassTeacherOf(teacher, slot);
    const subjects = assignedSubjects(teacher, slot);
    if (!classTeacher && subjects.length === 0) continue;
    if (!classTeacher) {
      if (attempt.source === "omr" && !released.has(releaseSlot(attempt))) continue;
      if (attempt.source === "upload" && !attempt.published) continue;
      const scoped = withSubjects(attempt, subjects);
      if (scoped.subjects.length === 0) continue;
      visible.push(scoped);
      continue;
    }
    visible.push(attempt);
  }
  return visible;
}

async function collectAttempts(schoolId?: string): Promise<Attempt[]> {
  const [scans, students, sets] = await Promise.all([
    omScanRepository.findOmScans(schoolId ? { schoolId } : {}),
    studentRepository.listAnalysisStudents(schoolId),
    resultRepository.findResultSets(schoolId ? { schoolId } : {}),
  ]);

  const byKey = new Map<string, Attempt>();

  for (const scan of scans) {
    const scores = Array.isArray(scan.subjectScores) ? (scan.subjectScores as SubjectScore[]) : [];
    const attempt: Attempt = {
      schoolId: scan.schoolId,
      schoolName: scan.school.name,
      schoolCode: scan.school.code,
      studentId: scan.student.id,
      name: scan.student.name,
      rollNo: scan.rollNo,
      programId: scan.student.programId,
      programCode: scan.student.program.code,
      programName: scan.student.program.name,
      classLevel: scan.student.classLevel,
      sectionId: scan.student.sectionId,
      sectionName: scan.student.section?.name ?? null,
      testId: scan.testId,
      testNumber: scan.answerKey.testNumber,
      source: "omr",
      published: true,
      subjects: scores.map((item) => ({ subject: item.subject, score: item.total, max: item.maxTotal })),
      percent: percentOf(scan.total, scan.maxTotal),
    };
    byKey.set(attemptKey(attempt), attempt);
  }

  const sheets = await resultRepository.findResultSheetsBySetIds(sets.map((set) => set.id));
  const sheetsBySet = new Map<string, typeof sheets>();
  for (const sheet of sheets) {
    const list = sheetsBySet.get(sheet.resultSetId);
    if (list) list.push(sheet);
    else sheetsBySet.set(sheet.resultSetId, [sheet]);
  }

  const studentsBySchool = new Map<string, typeof students>();
  for (const student of students) {
    const list = studentsBySchool.get(student.schoolId);
    if (list) list.push(student);
    else studentsBySchool.set(student.schoolId, [student]);
  }

  for (const set of sets) {
    for (const sheet of sheetsBySet.get(set.id) ?? []) {
      const roster = (studentsBySchool.get(set.school.id) ?? []).filter(
        (student) => student.classLevel === sheet.classLevel,
      );
      const rosterView: RosterStudent[] = roster.map((student) => ({
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        classLevel: student.classLevel,
        sectionId: student.sectionId,
        program: student.program,
        section: student.section,
      }));
      const columns = sheet.columns as string[];
      for (const row of sheet.rows) {
        const values = row.values as CellValue[];
        const student = matchRosterStudent(values, columns, rosterView);
        if (!student?.id) continue;
        const full = roster.find((item) => item.id === student.id);
        if (!full) continue;
        const parsed = parseScoreRow(columns, values);
        const attempt: Attempt = {
          schoolId: full.schoolId,
          schoolName: full.school.name,
          schoolCode: full.school.code,
          studentId: full.id,
          name: full.name,
          rollNo: full.rollNo,
          programId: full.programId,
          programCode: set.programCode ?? full.program.code,
          programName: set.programName ?? full.program.name,
          classLevel: full.classLevel,
          sectionId: full.sectionId,
          sectionName: full.section?.name ?? null,
          testId: set.testId,
          testNumber: set.testNumber,
          source: "upload",
          published: set.published,
          subjects: parsed.subjects.map((item) => ({
            subject: item.subject,
            score: item.score,
            max: item.max,
          })),
          percent: parsed.percentage ?? percentOf(parsed.total, parsed.maxTotal),
        };
        const key = attemptKey(attempt);
        if (!byKey.has(key)) byKey.set(key, attempt);
      }
    }
  }

  return [...byKey.values()];
}

export async function getAnalysis(query: AnalysisQuery, actor?: AnalysisActor): Promise<AnalysisReport> {
  const lockedSchoolId = actor?.kind === "school" ? actor.schoolId : actor?.kind === "teacher" ? actor.teacher.schoolId : undefined;
  const schoolId = lockedSchoolId ?? query.school;
  const [rawAttempts, schoolOptionsRows] = await Promise.all([
    collectAttempts(schoolId),
    actor ? Promise.resolve([]) : schoolRepository.findSchoolOptions({ status: SchoolStatus.ACTIVE }),
  ]);
  const attempts = actor?.kind === "teacher" ? await forTeacher(rawAttempts, actor.teacher) : rawAttempts;

  const inSchool = schoolId ? attempts.filter((row) => row.schoolId === schoolId) : attempts;
  const inProgram = query.program ? inSchool.filter((row) => matchesProgram(row, query.program!)) : inSchool;
  const inClass = query.class != null ? inProgram.filter((row) => row.classLevel === query.class) : inProgram;
  const inSection =
    query.section === WHOLE_CLASS
      ? inClass.filter((row) => row.sectionId == null)
      : query.section
        ? inClass.filter((row) => row.sectionId === query.section)
        : inClass;
  const scoped = query.test ? inSection.filter((row) => row.testId === query.test) : inSection;

  const catalogSchool = schoolOptionsRows.find((row) => row.id === schoolId);
  const schoolName = schoolId
    ? (inSchool[0]?.schoolName ??
      attempts.find((row) => row.schoolId === schoolId)?.schoolName ??
      catalogSchool?.name ??
      null)
    : null;
  const sectionName =
    query.section === WHOLE_CLASS
      ? "Whole class"
      : query.section
        ? (scoped[0]?.sectionName ?? inClass.find((row) => row.sectionId === query.section)?.sectionName ?? null)
        : null;

  const schools = groupRows(
    inSchool,
    (row) => row.schoolId,
    (row) => row.schoolName,
    (row) => ({ schoolId: row.schoolId }),
  );
  const programs = groupRows(
    inProgram,
    (row) => row.programCode,
    (row) => row.programName,
    (row) => ({ programCode: row.programCode }),
  );
  const classes = groupRows(
    inProgram,
    (row) => String(row.classLevel),
    (row) => `Class ${row.classLevel}`,
    (row) => ({ classLevel: row.classLevel }),
  );
  const sections = groupRows(
    inClass,
    (row) => row.sectionId ?? WHOLE_CLASS,
    (row) => (row.sectionName ? `Class ${row.classLevel}-${row.sectionName}` : `Class ${row.classLevel}`),
    (row) => ({
      classLevel: row.classLevel,
      sectionId: row.sectionId,
    }),
  );
  const testRows = groupRows(
    inSection,
    (row) => row.testId,
    (row) => `Test ${row.testNumber} · ${row.testId}`,
    (row) => ({ testId: row.testId, testNumber: row.testNumber }),
  ).sort((a, b) => (b.testNumber ?? 0) - (a.testNumber ?? 0) || a.label.localeCompare(b.label));

  const teacherView = actor?.kind === "teacher";
  const subjects = subjectStats(scoped);
  const percents = scoped.map((row) => row.percent).filter((value): value is number => value != null);
  const showSchools = !lockedSchoolId && !schoolId;
  const showPrograms = Boolean(schoolId) && query.class == null;
  const showClasses = Boolean(schoolId) && query.class == null;
  const showSections = Boolean(schoolId) && query.class != null && query.section == null && sections.length > 1;
  const showTests = (teacherView || Boolean(schoolId)) && query.test == null;
  const showStudents = teacherView || (Boolean(schoolId) && query.class != null);

  const schoolOptions =
    schoolOptionsRows.length > 0
      ? schoolOptionsRows.map((row) => ({ id: row.id, name: row.name, code: row.code }))
      : [...new Map(attempts.map((row) => [row.schoolId, { id: row.schoolId, name: row.schoolName, code: row.schoolCode }])).values()].sort(
          (a, b) => a.name.localeCompare(b.name),
        );
  const programOptions = [
    ...new Map(inSchool.map((row) => [row.programCode, { code: row.programCode, name: row.programName }])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const classOptions = [...new Set(inProgram.map((row) => row.classLevel))].sort((a, b) => a - b);
  const sectionOptions = [
    ...new Map(
      inClass.map((row) => [
        row.sectionId ?? WHOLE_CLASS,
        { id: row.sectionId ?? WHOLE_CLASS, name: row.sectionName ?? "Whole class" },
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const testOptions = [
    ...new Map(
      inSection.map((row) => [row.testId, { id: row.testId, label: `Test ${row.testNumber} · ${row.testId}` }]),
    ).values(),
  ];

  return {
    scope: {
      schoolId: schoolId ?? null,
      schoolName,
      program: query.program ?? null,
      classLevel: query.class ?? null,
      sectionId: query.section ?? null,
      sectionName,
      testId: query.test ?? null,
    },
    filters: {
      schools: schoolOptions,
      programs: programOptions,
      classes: classOptions,
      sections: sectionOptions,
      tests: testOptions,
    },
    totals: {
      schools: new Set(scoped.map((row) => row.schoolId)).size,
      students: new Set(scoped.map((row) => row.studentId)).size,
      tests: new Set(scoped.map((row) => row.testId)).size,
      avgPercent: average(percents),
      weakSubject: weakSubjectOf(subjects),
    },
    subjects,
    schools: showSchools ? schools : [],
    programs: showPrograms ? programs : [],
    classes: showClasses ? classes : [],
    sections: showSections ? sections : [],
    tests: showTests ? testRows : [],
    students: showStudents ? studentRows(scoped) : [],
  };
}
