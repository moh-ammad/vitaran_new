import { SchoolStatus, type Subject } from "../generated/prisma/enums.js";
import * as omScanRepository from "../repositories/om-scan.repository.js";
import * as resultRepository from "../repositories/result.repository.js";
import * as schoolRepository from "../repositories/school.repository.js";
import * as studentRepository from "../repositories/student.repository.js";
import type { AnalysisQuery, RankingQuery } from "../schemas/analysis.schema.js";
import type { CellValue } from "../utils/excel.js";
import type { SubjectScore } from "../utils/omr-score.js";
import {
  matchRosterStudent,
  parseScoreRow,
  type RosterStudent,
} from "../utils/result-sheet-scope.js";
import { assignedSubjects, isClassTeacherOf } from "./content-access.js";
import type { SchoolProgramDto } from "./school.service.js";
import type { StudentAccountDto } from "./student.service.js";
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
  weakSubject: Subject | null;
  subjects: AnalysisSubjectStat[];
};

export type AnalysisStudentFocus = {
  studentId: string;
  name: string;
  rollNo: string;
  classLevel: number;
  sectionName: string | null;
  programName: string;
  avgPercent: number | null;
  weakSubject: Subject | null;
  tests: Array<{
    testId: string;
    testNumber: number;
    percent: number | null;
    subjects: Array<{ subject: Subject; score: number; max: number | null; percent: number | null }>;
  }>;
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
    studentId: string | null;
    studentName: string | null;
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
  focus: AnalysisStudentFocus | null;
};

export type AnalysisActor =
  | {
      kind: "school";
      schoolId: string;
      schoolName: string;
      schoolCode: string;
      programs: SchoolProgramDto[];
    }
  | { kind: "teacher"; teacher: TeacherAccountDto }
  | { kind: "student"; student: StudentAccountDto };

const SUBJECT_ORDER: Subject[] = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "SCIENCE"];

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

function studentFocus(attempts: Attempt[]): AnalysisStudentFocus | null {
  if (attempts.length === 0) return null;
  const sample = attempts[0]!;
  const stats = subjectStats(attempts);
  const percents = attempts.map((row) => row.percent).filter((value): value is number => value != null);
  return {
    studentId: sample.studentId,
    name: sample.name,
    rollNo: sample.rollNo,
    classLevel: sample.classLevel,
    sectionName: sample.sectionName,
    programName: sample.programName,
    avgPercent: average(percents),
    weakSubject: weakSubjectOf(stats),
    tests: [...attempts]
      .sort((a, b) => a.testNumber - b.testNumber || a.testId.localeCompare(b.testId))
      .map((row) => ({
        testId: row.testId,
        testNumber: row.testNumber,
        percent: row.percent,
        subjects: row.subjects.map((item) => ({
          subject: item.subject,
          score: item.score,
          max: item.max,
          percent: percentOf(item.score, item.max),
        })),
      })),
    subjects: stats,
  };
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
      const subjects = subjectStats(rows);
      return {
        studentId: sample.studentId,
        name: sample.name,
        rollNo: sample.rollNo,
        classLevel: sample.classLevel,
        sectionName: sample.sectionName,
        programName: sample.programName,
        tests: new Set(rows.map((row) => row.testId)).size,
        avgPercent: average(percents),
        weakSubject: weakSubjectOf(subjects),
        subjects,
      };
    })
    .sort((a, b) => (b.avgPercent ?? -1) - (a.avgPercent ?? -1) || a.name.localeCompare(b.name));
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
  const [scans, students, sets, releases] = await Promise.all([
    omScanRepository.findOmScans(schoolId ? { schoolId } : {}),
    studentRepository.listAnalysisStudents(schoolId),
    resultRepository.findResultSets(schoolId ? { schoolId } : {}),
    omScanRepository.findOmResultReleases({ published: true, ...(schoolId ? { schoolId } : {}) }),
  ]);

  const released = new Set(
    releases.map((row) => [row.schoolId, row.testId, row.programId, row.classLevel, row.sectionKey].join(":")),
  );
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
      published: released.has(
        [scan.schoolId, scan.testId, scan.student.programId, scan.student.classLevel, scan.student.sectionId ?? "class"].join(
          ":",
        ),
      ),
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
  const attempts =
    actor?.kind === "teacher"
      ? await forTeacher(rawAttempts, actor.teacher)
      : rawAttempts.filter((row) => row.published);

  const inSchool = schoolId ? attempts.filter((row) => row.schoolId === schoolId) : attempts;
  const inProgram = query.program ? inSchool.filter((row) => matchesProgram(row, query.program!)) : inSchool;
  const inClass = query.class != null ? inProgram.filter((row) => row.classLevel === query.class) : inProgram;
  const inSection =
    query.section === WHOLE_CLASS
      ? inClass.filter((row) => row.sectionId == null)
      : query.section
        ? inClass.filter((row) => row.sectionId === query.section)
        : inClass;
  const inStudent = query.student ? inSection.filter((row) => row.studentId === query.student) : inSection;
  const scoped = query.test ? inStudent.filter((row) => row.testId === query.test) : inStudent;

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
    inClass,
    (row) => row.schoolId,
    (row) => row.schoolName,
    (row) => ({ schoolId: row.schoolId }),
  ).sort((a, b) => (b.avgPercent ?? -1) - (a.avgPercent ?? -1));
  const programs = groupRows(
    inProgram,
    (row) => row.programCode,
    (row) => row.programName,
    (row) => ({ programCode: row.programCode }),
  ).sort((a, b) => (b.avgPercent ?? -1) - (a.avgPercent ?? -1));
  const classes = groupRows(
    inProgram,
    (row) => `${row.programCode}:${row.classLevel}`,
    (row) =>
      query.program ? `Class ${row.classLevel}` : `Class ${row.classLevel} · ${row.programName}`,
    (row) => ({ classLevel: row.classLevel, programCode: row.programCode }),
  ).sort((a, b) => (b.avgPercent ?? -1) - (a.avgPercent ?? -1));
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

  const studentView = Boolean(query.student);
  const portalView = actor != null;
  const overview = !studentView && query.class == null;
  const focus = studentView ? studentFocus(scoped) : null;
  const subjects = subjectStats(scoped);
  const percents = scoped.map((row) => row.percent).filter((value): value is number => value != null);
  const showSchools = overview && !lockedSchoolId && !schoolId;
  const showPrograms = !studentView && query.program == null && query.class == null && programs.length > 0;
  const showClasses = overview && classes.length > 0;
  const showSections =
    !studentView && Boolean(schoolId) && query.class != null && query.section == null && sections.length > 1;
  const showTests = false;
  const showStudents = !studentView && portalView && query.class != null;

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
      (query.student ? inStudent : inSection).map((row) => [
        row.testId,
        { id: row.testId, label: `Test ${row.testNumber} · ${row.testId}` },
      ]),
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
      studentId: query.student ?? null,
      studentName: focus?.name ?? null,
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
    focus,
  };
}

export type RankingSubjectScore = { subject: Subject; score: number | null; max: number | null };

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
    kind: "admin" | "school" | "class-teacher" | "subject-teacher" | "student";
    selfStudentId: string | null;
  };
  scope: {
    schoolId: string | null;
    schoolName: string | null;
    program: string | null;
    programName: string | null;
    classLevel: number | null;
    mode: "test" | "overall";
    testId: string | null;
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

type RankingSlot = { programCode: string; programName: string; classLevel: number };

function rankingSlotKey(programCode: string, classLevel: number) {
  return `${programCode}:${classLevel}`;
}

function actorRankingSlots(actor?: AnalysisActor): RankingSlot[] | null {
  if (!actor) return null;
  if (actor.kind === "school") {
    return actor.programs.flatMap((program) =>
      program.classes.map((cls) => ({
        programCode: program.programCode,
        programName: program.programName,
        classLevel: cls.classLevel,
      })),
    );
  }
  if (actor.kind === "teacher") {
    const byKey = new Map<string, RankingSlot>();
    const add = (slot: RankingSlot) => byKey.set(rankingSlotKey(slot.programCode, slot.classLevel), slot);
    for (const row of actor.teacher.assignments) {
      add({ programCode: row.programCode, programName: row.programName, classLevel: row.classLevel });
    }
    for (const row of actor.teacher.classTeacherSections) {
      add({ programCode: row.programCode, programName: row.programName, classLevel: row.classLevel });
    }
    return [...byKey.values()];
  }
  return [
    {
      programCode: actor.student.programCode,
      programName: actor.student.programName,
      classLevel: actor.student.classLevel,
    },
  ];
}

function lockedSchoolRef(actor?: AnalysisActor) {
  if (actor?.kind === "school") {
    return { id: actor.schoolId, name: actor.schoolName, code: actor.schoolCode };
  }
  if (actor?.kind === "teacher") {
    return { id: actor.teacher.schoolId, name: actor.teacher.school.name, code: actor.teacher.school.code };
  }
  if (actor?.kind === "student") {
    return { id: actor.student.schoolId, name: actor.student.school.name, code: actor.student.school.code };
  }
  return null;
}

function isClassTeacherForClass(teacher: TeacherAccountDto, programCode: string, classLevel: number) {
  return teacher.classTeacherSections.some(
    (slot) => slot.programCode === programCode && slot.classLevel === classLevel,
  );
}

function rankingViewer(
  actor: AnalysisActor | undefined,
  programCode: string | null,
  classLevel: number | null,
): RankingReport["viewer"] {
  if (actor?.kind === "student") {
    return { kind: "student", selfStudentId: actor.student.id };
  }
  if (actor?.kind === "teacher" && programCode && classLevel != null) {
    if (isClassTeacherForClass(actor.teacher, programCode, classLevel)) {
      return { kind: "class-teacher", selfStudentId: null };
    }
    return { kind: "subject-teacher", selfStudentId: null };
  }
  if (actor?.kind === "school") return { kind: "school", selfStudentId: null };
  return { kind: "admin", selfStudentId: null };
}

function rankRows(rows: Omit<RankingRow, "rank">[]): RankingRow[] {
  const sorted = [...rows].sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1) || a.name.localeCompare(b.name),
  );
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

function subjectColumns(attempts: Attempt[]): Subject[] {
  const present = new Set(attempts.flatMap((row) => row.subjects.map((item) => item.subject)));
  return [...SUBJECT_ORDER.filter((item) => present.has(item)), ...[...present].filter((item) => !SUBJECT_ORDER.includes(item))];
}

function attemptMarks(attempt: Attempt) {
  const scores = attempt.subjects.map((item) => item.score);
  const maxes = attempt.subjects
    .map((item) => item.max)
    .filter((value): value is number => value != null && value > 0);
  return {
    score: scores.length > 0 ? round1(scores.reduce((sum, value) => sum + value, 0)) : null,
    max: maxes.length === attempt.subjects.length ? round1(maxes.reduce((sum, value) => sum + value, 0)) : null,
  };
}

function rankingSubjectMarks(attempts: Attempt[], subject: Subject): RankingSubjectScore {
  const hits = attempts.flatMap((row) => row.subjects.filter((item) => item.subject === subject));
  const scores = hits.map((item) => item.score);
  const maxes = hits.map((item) => item.max).filter((value): value is number => value != null && value > 0);
  return {
    subject,
    score: average(scores),
    max: average(maxes),
  };
}

function toRankingRows(attempts: Attempt[], subjects: Subject[]): Omit<RankingRow, "rank">[] {
  const groups = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const list = groups.get(attempt.studentId);
    if (list) list.push(attempt);
    else groups.set(attempt.studentId, [attempt]);
  }
  return [...groups.values()].map((rows) => {
    const sample = rows[0]!;
    const totals = rows.map(attemptMarks);
    return {
      studentId: sample.studentId,
      name: sample.name,
      rollNo: sample.rollNo,
      schoolId: sample.schoolId,
      schoolName: sample.schoolName,
      schoolCode: sample.schoolCode,
      sectionName: sample.sectionName,
      tests: new Set(rows.map((row) => row.testId)).size,
      score: average(totals.map((item) => item.score).filter((value): value is number => value != null)),
      max: average(totals.map((item) => item.max).filter((value): value is number => value != null)),
      subjects: subjects.map((subject) => rankingSubjectMarks(rows, subject)),
    };
  });
}

export async function getRanking(query: RankingQuery, actor?: AnalysisActor): Promise<RankingReport> {
  const student = actor?.kind === "student" ? actor.student : null;
  const locked = lockedSchoolRef(actor);
  const lockedSchoolId = locked?.id;
  const rawAttempts = await collectAttempts(lockedSchoolId);
  let published =
    actor?.kind === "teacher"
      ? (await forTeacher(rawAttempts, actor.teacher)).filter((row) => row.published)
      : rawAttempts.filter((row) => row.published);

  const slots = actorRankingSlots(actor);
  if (slots) {
    const allowed = new Set(slots.map((slot) => rankingSlotKey(slot.programCode, slot.classLevel)));
    published = published.filter((row) => allowed.has(rankingSlotKey(row.programCode, row.classLevel)));
  }

  const home = lockedSchoolId ? published.filter((row) => row.schoolId === lockedSchoolId) : published;
  const ranked = [
    ...new Map(
      home.map((row) => [
        rankingSlotKey(row.programCode, row.classLevel),
        { program: row.programCode, programName: row.programName, classLevel: row.classLevel },
      ]),
    ).values(),
  ].sort((a, b) => a.programName.localeCompare(b.programName) || a.classLevel - b.classLevel);
  const programOptions = (
    slots
      ? [...new Map(slots.map((slot) => [slot.programCode, { code: slot.programCode, name: slot.programName }])).values()]
      : [...new Map(home.map((row) => [row.programCode, { code: row.programCode, name: row.programName }])).values()]
  )
    .map((item) => ({ ...item, hasScores: ranked.some((row) => row.program === item.code) }))
    .sort((a, b) => Number(b.hasScores) - Number(a.hasScores) || a.name.localeCompare(b.name));

  const requestedProgram = student?.programCode ?? query.program;
  const program =
    requestedProgram && programOptions.some((item) => item.code === requestedProgram)
      ? requestedProgram
      : (ranked[0]?.program ?? programOptions[0]?.code ?? null);
  const inProgram = program ? home.filter((row) => matchesProgram(row, program)) : [];
  const rankedInProgram = ranked.filter((row) => row.program === program);
  const classOptions = (
    slots && program
      ? [...new Set(slots.filter((slot) => slot.programCode === program).map((slot) => slot.classLevel))]
      : [...new Set([...inProgram.map((row) => row.classLevel), ...rankedInProgram.map((row) => row.classLevel)])]
  )
    .sort((a, b) => a - b)
    .map((level) => ({ level, hasScores: rankedInProgram.some((row) => row.classLevel === level) }));
  const requestedClass = student?.classLevel ?? query.class;
  const classLevel =
    requestedClass != null && classOptions.some((item) => item.level === requestedClass)
      ? requestedClass
      : (rankedInProgram[0]?.classLevel ?? classOptions[0]?.level ?? null);
  const inClassAllSchools = classLevel != null ? inProgram.filter((row) => row.classLevel === classLevel) : [];
  const schoolId = lockedSchoolId ?? query.school;
  const inClass = schoolId ? inClassAllSchools.filter((row) => row.schoolId === schoolId) : inClassAllSchools;

  const tests = [
    ...new Map(
      inClass.map((row) => [
        row.testId,
        {
          id: row.testId,
          testNumber: row.testNumber,
          label: `Test ${row.testNumber} · ID ${row.testId}`,
        },
      ]),
    ).values(),
  ].sort((a, b) => b.testNumber - a.testNumber || a.id.localeCompare(b.id));
  const latestId = tests[0]?.id ?? null;
  const mode = query.mode === "overall" ? "overall" : "test";
  const testId = mode === "test" ? (tests.some((item) => item.id === query.test) ? query.test! : latestId) : null;
  const scoped = mode === "overall" ? inClass : inClass.filter((row) => row.testId === testId);
  const subjects = subjectColumns(scoped);
  const rows = rankRows(toRankingRows(scoped, subjects));
  const programName = inProgram[0]?.programName ?? programOptions.find((item) => item.code === program)?.name ?? null;
  const testMeta = tests.find((item) => item.id === testId);
  const schoolOptions = locked
    ? [{ id: locked.id, name: locked.name, code: locked.code }]
    : [
        ...new Map(
          inClassAllSchools.map((row) => [row.schoolId, { id: row.schoolId, name: row.schoolName, code: row.schoolCode }]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name));
  const schoolName = schoolId
    ? (inClass[0]?.schoolName ??
      home.find((row) => row.schoolId === schoolId)?.schoolName ??
      schoolOptions.find((row) => row.id === schoolId)?.name ??
      locked?.name ??
      null)
    : null;

  return {
    viewer: rankingViewer(actor, program, classLevel),
    scope: {
      schoolId: schoolId ?? null,
      schoolName,
      program,
      programName,
      classLevel,
      mode,
      testId,
      testLabel: testMeta ? `${testMeta.label}${testMeta.id === latestId ? " · Latest" : ""}` : null,
    },
    filters: {
      schools: schoolOptions,
      programs: programOptions,
      classes: classOptions,
      ranked,
      tests: tests.map((item) => ({
        ...item,
        label: item.id === latestId ? `${item.label} · Latest` : item.label,
        latest: item.id === latestId,
      })),
    },
    subjects,
    rows,
  };
}
