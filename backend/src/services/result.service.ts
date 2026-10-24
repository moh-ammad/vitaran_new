import { Prisma } from "../generated/prisma/client.js";
import { SchoolType } from "../generated/prisma/enums.js";
import * as resultRepository from "../repositories/result.repository.js";
import type {
  NewResultSheet,
  ResultSetMeta,
  ResultSetSummary,
} from "../repositories/result.repository.js";
import * as schoolRepository from "../repositories/school.repository.js";
import {
  CLASS_LEVELS,
  classFileField,
  type ListResultSetsQuery,
  type ResultSetFields,
  type ResultSheetParams,
} from "../schemas/result.schema.js";
import { AppError } from "../utils/app-error.js";
import { notifyContentChanged } from "../utils/content-events.js";
import { ExcelParseError, parseResultSheet, type CellValue } from "../utils/excel.js";
import * as answerKeyRepository from "../repositories/answer-key.repository.js";
import * as studentRepository from "../repositories/student.repository.js";
import type { Subject } from "../generated/prisma/enums.js";
import { asSubjectRanges } from "../utils/answer-key-parse.js";
import type { SubjectScore } from "../utils/omr-score.js";
import { findVisibleOmScans, type OmScanViewer } from "./om-scan.service.js";
import {
  canonicalizePaperMaxes,
  findRowForStudent,
  overlayOmrOnRows,
  parseScoreRow,
  projectSheetForTeacher,
} from "../utils/result-sheet-scope.js";
import {
  resultSetAccessFilter,
  resultSetMatchesProgram,
  resultSetVisibleToTeacher,
  resultSheetClassFilter,
  type ContentActor,
} from "./content-access.js";
import { toSchoolRef, type SchoolAccountDto } from "./school.service.js";
import type { StudentAccountDto } from "./student.service.js";

const KIND = "results";

export type UploadedFiles = Partial<Record<string, Express.Multer.File[]>>;

type FieldIssue = { path: [string]; message: string };

const fieldError = (status: number, path: string, message: string) =>
  new AppError(status, message, [{ path: [path], message }] satisfies FieldIssue[]);

function toResultSetDto({ school, sheets, createdAt, updatedAt, publishedAt, programCode, ...rest }: ResultSetSummary) {
  return {
    ...rest,
    program: programCode,
    programCode,
    publishedAt: publishedAt?.toISOString() ?? null,
    school: { ...toSchoolRef(school), type: school.type },
    classes: sheets.map(({ updatedAt: sheetUpdatedAt, ...sheet }) => ({
      ...sheet,
      updatedAt: sheetUpdatedAt.toISOString(),
    })),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

/** Regular schools pick one of their programs; customized schools name their own. */
async function resolveMeta({
  schoolId,
  program,
  programName,
  testId,
  testNumber,
}: ResultSetFields): Promise<ResultSetMeta> {
  const school = await schoolRepository.findSchoolById(schoolId);
  if (!school) throw fieldError(400, "schoolId", "Select a school");

  if (school.type === SchoolType.CUSTOMIZED) {
    if (!programName) throw fieldError(400, "programName", "Enter the program name");
    return {
      schoolId,
      programCode: null,
      programName,
      programKey: `custom:${programName.toLowerCase().replace(/\s+/g, " ")}`,
      testId,
      testNumber,
    };
  }

  if (!program) throw fieldError(400, "program", "Select a program");
  const enrolled = school.schoolPrograms.some((row) => row.program.code === program);
  if (!enrolled) {
    throw fieldError(400, "program", "This school isn't enrolled in that program");
  }
  return {
    schoolId,
    programCode: program,
    programName: null,
    programKey: program,
    testId,
    testNumber,
  };
}

/** Parses every uploaded class file, reporting all bad files at once. */
async function readSheets(files: UploadedFiles = {}): Promise<NewResultSheet[]> {
  const sheets: NewResultSheet[] = [];
  const issues: FieldIssue[] = [];

  for (const classLevel of CLASS_LEVELS) {
    const field = classFileField(classLevel);
    const file = files[field]?.[0];
    if (!file || file.size === 0) continue;

    try {
      sheets.push({
        classLevel,
        fileName: file.originalname.slice(0, 255),
        fileSize: file.size,
        data: new Uint8Array(file.buffer),
        ...(await parseResultSheet(file.buffer)),
      });
    } catch (error) {
      if (!(error instanceof ExcelParseError)) throw error;
      issues.push({ path: [field], message: error.message });
    }
  }

  if (issues.length > 0) throw new AppError(400, "Some class files couldn't be read", issues);
  return sheets;
}

function duplicateTest(error: unknown, testNumber: number) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return fieldError(
      409,
      "testNumber",
      `Test ${testNumber} results for this program already exist for this school. Edit them instead.`,
    );
  }
  return error;
}

const requireClasses = (count: number) => {
  if (count === 0) throw fieldError(400, "classes", "Upload at least one class");
};

export async function listResultSets({ limit, testNumber, type, schoolId }: ListResultSetsQuery) {
  const where: Prisma.ResultSetWhereInput = { testNumber, schoolId, ...(type && { school: { type } }) };
  return (await resultRepository.findResultSets(where, limit)).map(toResultSetDto);
}

export async function getResultStats() {
  const [total, published] = await Promise.all([
    resultRepository.countResultSets(),
    resultRepository.countResultSets({ published: true }),
  ]);
  return { total, published };
}

/** Schools only reach their own results, and only once the admin has published them. */
function withActorSheetFilter<T extends { classes: { classLevel: number }[] }>(
  dto: T,
  actor?: ContentActor,
): T {
  const allowed = actor ? resultSheetClassFilter(actor) : null;
  if (!allowed) return dto;
  return { ...dto, classes: dto.classes.filter((sheet) => allowed.includes(sheet.classLevel)) };
}

function toContentActor(actor?: ContentActor | SchoolAccountDto): ContentActor | undefined {
  if (!actor) return undefined;
  if ("kind" in actor) return actor;
  return { kind: "school", school: actor };
}

export async function getResultSet(id: string, actor?: ContentActor | SchoolAccountDto) {
  const contentActor = toContentActor(actor);
  const resultSet = await resultRepository.findResultSet({
    id,
    ...(contentActor && resultSetAccessFilter(contentActor)),
  });
  if (!resultSet) throw new AppError(404, "Result not found");
  if (contentActor?.kind === "teacher" && !resultSetVisibleToTeacher(contentActor.teacher, resultSet)) {
    throw new AppError(404, "Result not found");
  }
  const dto = withActorSheetFilter(toResultSetDto(resultSet), contentActor);
  if (contentActor?.kind === "teacher" && dto.classes.length === 0) {
    throw new AppError(404, "Result not found");
  }
  return dto;
}

export async function uploadResultSet(fields: ResultSetFields, files?: UploadedFiles) {
  const meta = await resolveMeta(fields);
  const sheets = await readSheets(files);
  requireClasses(sheets.length);

  try {
    return toResultSetDto(await resultRepository.createResultSet(meta, sheets));
  } catch (error) {
    throw duplicateTest(error, meta.testNumber);
  }
}

export async function updateResultSet(id: string, fields: ResultSetFields, files?: UploadedFiles) {
  const meta = await resolveMeta(fields);
  const sheets = await readSheets(files);

  let resultSet: ResultSetSummary;
  try {
    resultSet = await resultRepository.updateResultSet(id, meta, sheets, fields.removeClasses, requireClasses);
  } catch (error) {
    throw duplicateTest(error, meta.testNumber);
  }
  // The set may have moved to another school, so tell every school.
  if (resultSet.published) notifyContentChanged({ kind: KIND, schoolId: null });
  return toResultSetDto(resultSet);
}

export async function deleteResultSet(id: string) {
  const { schoolId, published } = await resultRepository.deleteResultSet(id);
  if (published) notifyContentChanged({ kind: KIND, schoolId });
}

const sheetWhere = ({ id, classLevel }: ResultSheetParams, actor?: ContentActor) => ({
  classLevel,
  resultSet: { id, ...(actor && resultSetAccessFilter(actor)) },
});

function assertSheetClassAllowed(classLevel: number, actor?: ContentActor) {
  const allowed = actor ? resultSheetClassFilter(actor) : null;
  if (allowed && !allowed.includes(classLevel)) {
    throw new AppError(404, "Result not found");
  }
}

async function paperRangesForTest(testId: string) {
  const key = await answerKeyRepository.findAnswerKeyByTestId(testId);
  return asSubjectRanges(key?.subjectRanges);
}

/** Unpublished OMR scores stay out of result sheets for anyone but admin and the class teacher. */
async function overlayOmrForTest(
  schoolId: string,
  testId: string,
  columns: string[],
  rows: CellValue[][],
  viewer: OmScanViewer,
) {
  const scans = await findVisibleOmScans(schoolId, testId, viewer);
  return overlayOmrOnRows(
    columns,
    rows,
    scans.map((scan) => ({
      rollNo: scan.rollNo,
      subjectScores: scan.subjectScores as SubjectScore[],
      total: scan.total,
      maxTotal: scan.maxTotal,
    })),
  );
}

export async function getResultSheet(params: ResultSheetParams, actor?: ContentActor | SchoolAccountDto) {
  const contentActor = toContentActor(actor);
  assertSheetClassAllowed(params.classLevel, contentActor);
  const sheet = await resultRepository.findResultSheet(sheetWhere(params, contentActor));
  if (!sheet) throw new AppError(404, "Result not found");

  const resultSet = await resultRepository.findResultSet({
    id: params.id,
    ...(contentActor && resultSetAccessFilter(contentActor)),
  });
  const ranges = resultSet ? await paperRangesForTest(resultSet.testId) : [];

  const { rows, columns, updatedAt, caption, ...rest } = sheet;
  let parsedColumns = columns as string[];
  let parsedRows = await overlayOmrForTest(
    resultSet?.school.id ?? "",
    resultSet?.testId ?? "",
    columns as string[],
    rows.map(({ values }) => values as CellValue[]),
    !contentActor
      ? { kind: "admin" }
      : contentActor.kind === "teacher"
        ? { kind: "teacher", teacher: contentActor.teacher }
        : { kind: "released" },
  );
  let parsedCaption = caption;
  if (contentActor?.kind === "teacher") {
    const roster = await studentRepository.listSchoolRoster(contentActor.teacher.schoolId);
    const scoped = projectSheetForTeacher(parsedColumns, parsedRows, contentActor.teacher, roster);
    parsedColumns = scoped.columns;
    parsedRows = scoped.rows;
    const paper = canonicalizePaperMaxes(parsedColumns, parsedRows, parsedCaption, ranges);
    return {
      ...rest,
      caption: paper.caption,
      columns: paper.columns,
      rows: paper.rows,
      rowCount: paper.rows.length,
      classLabel: scoped.classLabel,
      updatedAt: updatedAt.toISOString(),
    };
  }
  const paper = canonicalizePaperMaxes(parsedColumns, parsedRows, parsedCaption, ranges);
  return {
    ...rest,
    caption: paper.caption,
    columns: paper.columns,
    rows: paper.rows,
    updatedAt: updatedAt.toISOString(),
  };
}

export async function getResultSheetFile(
  params: ResultSheetParams,
  actor?: ContentActor | SchoolAccountDto,
) {
  const contentActor = toContentActor(actor);
  assertSheetClassAllowed(params.classLevel, contentActor);
  const file = await resultRepository.findResultSheetFile(sheetWhere(params, contentActor));
  if (!file) throw new AppError(404, "Result not found");
  return file;
}

export async function listVisibleResultSets(actor: ContentActor) {
  const sets = await resultRepository.findResultSets(resultSetAccessFilter(actor));
  const visible = sets.filter((set) =>
    actor.kind === "school" ? true : resultSetVisibleToTeacher(actor.teacher, set),
  );
  if (actor.kind !== "teacher") {
    return visible.map((set) => withActorSheetFilter(toResultSetDto(set), actor));
  }

  const roster = await studentRepository.listSchoolRoster(actor.teacher.schoolId);
  const dtos = [];
  for (const set of visible) {
    const dto = withActorSheetFilter(toResultSetDto(set), actor);
    const classes = [];
    for (const item of dto.classes) {
      const sheet = await resultRepository.findResultSheet({
        classLevel: item.classLevel,
        resultSet: { id: set.id },
      });
      if (!sheet) continue;
      const scoped = projectSheetForTeacher(
        sheet.columns as string[],
        sheet.rows.map(({ values }) => values as CellValue[]),
        actor.teacher,
        roster,
      );
      if (scoped.rows.length === 0) continue;
      classes.push({ ...item, rowCount: scoped.rows.length, label: scoped.classLabel });
    }
    if (classes.length === 0) continue;
    dtos.push({ ...dto, classes });
  }
  return dtos;
}

export async function countVisibleResultSets(actor: ContentActor) {
  if (actor.kind === "teacher") return (await listVisibleResultSets(actor)).length;
  return resultRepository.countResultSets(resultSetAccessFilter(actor));
}

export type StudentResultRowDto = {
  resultSetId: string;
  testId: string;
  testNumber: number;
  programName: string;
  classLevel: number;
  sectionName: string | null;
  caption: string[];
  subjects: Array<{ subject: Subject; score: number; max: number | null }>;
  total: number | null;
  maxTotal: number | null;
  percentage: number | null;
  updatedAt: string;
};

export async function listStudentResultRows(student: StudentAccountDto): Promise<StudentResultRowDto[]> {
  const sets = await resultRepository.findResultSets({ schoolId: student.schoolId, published: true });
  const rows: StudentResultRowDto[] = [];
  for (const set of sets) {
    if (!resultSetMatchesProgram(set, [{ programCode: student.programCode, programName: student.programName }])) {
      continue;
    }
    if (!set.sheets.some((sheet) => sheet.classLevel === student.classLevel)) continue;
    const sheet = await resultRepository.findResultSheet({
      classLevel: student.classLevel,
      resultSet: { id: set.id },
    });
    if (!sheet) continue;
    const paper = canonicalizePaperMaxes(
      sheet.columns as string[],
      await overlayOmrForTest(
        student.schoolId,
        set.testId,
        sheet.columns as string[],
        sheet.rows.map(({ values }) => values as CellValue[]),
        { kind: "released" },
      ),
      sheet.caption,
      await paperRangesForTest(set.testId),
    );
    const row = findRowForStudent(paper.columns, paper.rows, student);
    if (!row) continue;
    const scores = parseScoreRow(paper.columns, row);
    rows.push({
      resultSetId: set.id,
      testId: set.testId,
      testNumber: set.testNumber,
      programName: set.programName ?? student.programName,
      classLevel: student.classLevel,
      sectionName: student.sectionName,
      caption: paper.caption,
      subjects: scores.subjects,
      total: scores.total,
      maxTotal: scores.maxTotal,
      percentage: scores.percentage,
      updatedAt: sheet.updatedAt.toISOString(),
    });
  }
  return rows.sort((a, b) => a.testNumber - b.testNumber);
}

export async function listSchoolResultSets(school: SchoolAccountDto) {
  return listVisibleResultSets({ kind: "school", school });
}

export async function setResultSetPublished(id: string, published: boolean) {
  const resultSet = await resultRepository.setResultSetPublished(id, published);
  if (!resultSet) throw new AppError(404, "Result not found");
  notifyContentChanged({ kind: KIND, schoolId: resultSet.school.id });
  return toResultSetDto(resultSet);
}
