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
import * as omScanRepository from "../repositories/om-scan.repository.js";
import type { OmScanSummary } from "../repositories/om-scan.repository.js";
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
  contentSchool,
  resultSetAccessFilter,
  resultSetMatchesProgram,
  resultSetVisibleToTeacher,
  resultSheetClassFilter,
  teacherCanAccessStudent,
  type ContentActor,
} from "./content-access.js";
import { toSchoolRef, type SchoolAccountDto } from "./school.service.js";
import type { StudentAccountDto } from "./student.service.js";

const KIND = "results";
const OMR_ID_PREFIX = "omr_";
const SUBJECT_HEADER: Record<Subject, string> = {
  MATHEMATICS: "Mathematics",
  PHYSICS: "Physics",
  CHEMISTRY: "Chemistry",
  BIOLOGY: "Biology",
  SCIENCE: "Science",
};
const SUBJECT_ORDER: Subject[] = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "SCIENCE"];

function isOmrResultId(id: string) {
  return id.startsWith(OMR_ID_PREFIX);
}

function omrResultId(schoolId: string, programId: string, testId: string) {
  return `${OMR_ID_PREFIX}${schoolId}_${programId}_${encodeURIComponent(testId)}`;
}

function parseOmrResultId(id: string) {
  if (!isOmrResultId(id)) return null;
  const body = id.slice(OMR_ID_PREFIX.length);
  const schoolId = body.slice(0, 36);
  if (body[36] !== "_") return null;
  const rest = body.slice(37);
  const programId = rest.slice(0, 36);
  if (rest[36] !== "_") return null;
  try {
    return { schoolId, programId, testId: decodeURIComponent(rest.slice(37)) };
  } catch {
    return null;
  }
}

function scanReleaseKey(row: OmScanSummary) {
  return [row.schoolId, row.testId, row.student.programId, row.student.classLevel, row.student.sectionId ?? "class"].join(
    ":",
  );
}

function sheetFromOmScans(scans: OmScanSummary[], classLevel: number) {
  const present = new Set(
    scans.flatMap((scan) => (Array.isArray(scan.subjectScores) ? (scan.subjectScores as SubjectScore[]) : []).map((item) => item.subject)),
  );
  const subjects = [...SUBJECT_ORDER.filter((item) => present.has(item)), ...[...present].filter((item) => !SUBJECT_ORDER.includes(item))];
  const columns = ["Roll No", "Name", "Class", ...subjects.map((item) => SUBJECT_HEADER[item] ?? item), "Total", "Percentage"];
  const rows: CellValue[][] = [...scans]
    .sort((a, b) => a.rollNo.localeCompare(b.rollNo))
    .map((scan) => {
      const scores = Array.isArray(scan.subjectScores) ? (scan.subjectScores as SubjectScore[]) : [];
      const klass = scan.student.section?.name
        ? `${scan.student.classLevel}-${scan.student.section.name}`
        : String(scan.student.classLevel);
      const percent = scan.maxTotal ? Math.round((scan.total / scan.maxTotal) * 1000) / 10 : null;
      return [
        scan.rollNo,
        scan.student.name,
        klass,
        ...subjects.map((subject) => scores.find((item) => item.subject === subject)?.total ?? null),
        scan.total,
        percent,
      ];
    });
  const latest = scans.reduce((max, scan) => (scan.updatedAt > max ? scan.updatedAt : max), scans[0]?.updatedAt ?? new Date());
  return {
    classLevel,
    fileName: "OMR scan",
    fileSize: 0,
    caption: [`Test ${scans[0]?.answerKey.testNumber ?? ""} · ID ${scans[0]?.testId ?? ""}`],
    columns,
    rows,
    rowCount: rows.length,
    updatedAt: latest.toISOString(),
  };
}

async function publishedOmScans(schoolId?: string) {
  const [scans, releases] = await Promise.all([
    omScanRepository.findOmScans(schoolId ? { schoolId } : {}),
    omScanRepository.findOmResultReleases({ published: true, ...(schoolId ? { schoolId } : {}) }),
  ]);
  const released = new Set(
    releases.map((row) => [row.schoolId, row.testId, row.programId, row.classLevel, row.sectionKey].join(":")),
  );
  return scans.filter((scan) => released.has(scanReleaseKey(scan)));
}

function toOmrResultSetDto(scans: OmScanSummary[]) {
  const sample = scans[0]!;
  const byClass = new Map<number, OmScanSummary[]>();
  for (const scan of scans) {
    const list = byClass.get(scan.student.classLevel);
    if (list) list.push(scan);
    else byClass.set(scan.student.classLevel, [scan]);
  }
  const updatedAt = scans.reduce((max, scan) => (scan.updatedAt > max ? scan.updatedAt : max), sample.updatedAt);
  const publishedAt = updatedAt;
  return {
    id: omrResultId(sample.schoolId, sample.student.programId, sample.testId),
    source: "omr" as const,
    program: sample.student.program.code,
    programCode: sample.student.program.code,
    programName: sample.student.program.name,
    testId: sample.testId,
    testNumber: sample.answerKey.testNumber,
    published: true,
    publishedAt: publishedAt.toISOString(),
    school: { ...toSchoolRef(sample.school), type: sample.school.type },
    classes: [...byClass.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([classLevel, rows]) => ({
        classLevel,
        rowCount: rows.length,
        fileName: "OMR scan",
        fileSize: 0,
        updatedAt: rows.reduce((max, row) => (row.updatedAt > max ? row.updatedAt : max), rows[0]!.updatedAt).toISOString(),
      })),
    createdAt: updatedAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export type UploadedFiles = Partial<Record<string, Express.Multer.File[]>>;

type FieldIssue = { path: [string]; message: string };

const fieldError = (status: number, path: string, message: string) =>
  new AppError(status, message, [{ path: [path], message }] satisfies FieldIssue[]);

function toResultSetDto({ school, sheets, createdAt, updatedAt, publishedAt, programCode, ...rest }: ResultSetSummary) {
  return {
    ...rest,
    source: "upload" as const,
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

type ResultSetDto = ReturnType<typeof toResultSetDto> | ReturnType<typeof toOmrResultSetDto>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function foldTestId(value: string) {
  return value.trim().toLowerCase();
}

function foldProgramCode(row: ResultSetDto) {
  return (row.programCode || row.program || "").trim().toUpperCase();
}

function foldProgramName(row: ResultSetDto) {
  return (row.programName ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function sameProgram(a: ResultSetDto, b: ResultSetDto) {
  const codeA = foldProgramCode(a);
  const codeB = foldProgramCode(b);
  if (codeA && codeB) return codeA === codeB;
  const nameA = foldProgramName(a);
  const nameB = foldProgramName(b);
  if (nameA && nameB) return nameA === nameB;
  const code = codeA || codeB;
  const name = nameA || nameB;
  if (!code || !name) return false;
  const fromCode = code.replaceAll("_", " ").toLowerCase();
  return name === fromCode || name.includes(fromCode) || fromCode.includes(name);
}

function sameTest(a: ResultSetDto, b: ResultSetDto) {
  return a.school.id === b.school.id && foldTestId(a.testId) === foldTestId(b.testId) && sameProgram(a, b);
}

function laterIso(a: string, b: string) {
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function absorbOmr(excel: ResultSetDto, omr: ResultSetDto): ResultSetDto {
  const classes = new Map(excel.classes.map((row) => [row.classLevel, { ...row }]));
  for (const row of omr.classes) {
    const current = classes.get(row.classLevel);
    if (!current) {
      classes.set(row.classLevel, row);
      continue;
    }
    current.rowCount = Math.max(current.rowCount, row.rowCount);
    current.updatedAt = laterIso(current.updatedAt, row.updatedAt);
  }
  return {
    ...excel,
    classes: [...classes.values()].sort((a, b) => a.classLevel - b.classLevel),
    updatedAt: laterIso(excel.updatedAt, omr.updatedAt),
  };
}

function mergeOmrSets(excel: ResultSetDto[], omr: ResultSetDto[]) {
  const used = new Set<string>();
  const merged = excel.map((item) => {
    const match = omr.find((row) => sameTest(item, row));
    if (!match) return item;
    used.add(match.id);
    return absorbOmr(item, match);
  });
  const extra = omr.filter((row) => !used.has(row.id));
  return [...merged, ...extra].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function slugProgram(row: Pick<ResultSetDto, "program" | "programCode" | "programName">) {
  const code = (row.programCode || row.program || "").trim().toUpperCase();
  if (code) return code.replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "TEST";
  return (row.programName ?? "test")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "TEST";
}

function parsePublicSlug(id: string) {
  const at = id.indexOf("~");
  if (at <= 0 || at === id.length - 1) return null;
  if (UUID_RE.test(id) || isOmrResultId(id)) return null;
  return { program: id.slice(0, at).toUpperCase(), testId: id.slice(at + 1) };
}

function matchesPublicSlug(row: ResultSetDto, slug: { program: string; testId: string }) {
  return foldTestId(row.testId) === foldTestId(slug.testId) && slugProgram(row) === slug.program;
}

function scansForTeacher(scans: OmScanSummary[], actor?: ContentActor) {
  if (actor?.kind !== "teacher") return scans;
  return scans.filter((scan) =>
    teacherCanAccessStudent(actor.teacher, {
      programCode: scan.student.program.code,
      classLevel: scan.student.classLevel,
      sectionId: scan.student.sectionId,
    }),
  );
}

function omrSetForActor(scans: OmScanSummary[], actor?: ContentActor) {
  const visible = scansForTeacher(scans, actor);
  if (visible.length === 0) return null;
  const dto = toOmrResultSetDto(visible);
  if (actor?.kind === "teacher" && !resultSetVisibleToTeacher(actor.teacher, dto)) return null;
  return withActorSheetFilter(dto, actor);
}

async function publishedOmrGroups(schoolId?: string) {
  const scans = await publishedOmScans(schoolId);
  const groups = new Map<string, OmScanSummary[]>();
  for (const scan of scans) {
    const key = omrResultId(scan.schoolId, scan.student.programId, scan.testId);
    const list = groups.get(key);
    if (list) list.push(scan);
    else groups.set(key, [scan]);
  }
  return [...groups.values()];
}

async function listPublishedOmrResultSets(schoolId?: string, actor?: ContentActor) {
  const dtos = [];
  for (const scans of await publishedOmrGroups(schoolId)) {
    const dto = omrSetForActor(scans, actor);
    if (dto) dtos.push(dto);
  }
  return dtos;
}

function rejectOmrMutation(id: string) {
  if (isOmrResultId(id)) {
    throw new AppError(400, "OMR results are published from the scan board");
  }
}

async function getOmrResultSet(id: string, actor?: ContentActor) {
  const parsed = parseOmrResultId(id);
  if (!parsed) throw new AppError(404, "Result not found");
  if (actor && contentSchool(actor).id !== parsed.schoolId) throw new AppError(404, "Result not found");
  const scans = (await publishedOmScans(parsed.schoolId)).filter(
    (scan) => scan.student.programId === parsed.programId && scan.testId === parsed.testId,
  );
  const dto = omrSetForActor(scans, actor);
  if (!dto) throw new AppError(404, "Result not found");
  return dto;
}

async function getOmrResultSheet(params: ResultSheetParams, actor?: ContentActor) {
  assertSheetClassAllowed(params.classLevel, actor);
  const parsed = parseOmrResultId(params.id);
  if (!parsed) throw new AppError(404, "Result not found");
  if (actor && contentSchool(actor).id !== parsed.schoolId) throw new AppError(404, "Result not found");
  const scans = scansForTeacher(
    (await publishedOmScans(parsed.schoolId)).filter(
      (scan) =>
        scan.student.programId === parsed.programId &&
        scan.testId === parsed.testId &&
        scan.student.classLevel === params.classLevel,
    ),
    actor,
  );
  if (scans.length === 0) throw new AppError(404, "Result not found");
  const built = sheetFromOmScans(scans, params.classLevel);
  if (actor?.kind === "teacher") {
    const roster = await studentRepository.listSchoolRoster(actor.teacher.schoolId);
    const scoped = projectSheetForTeacher(built.columns, built.rows, actor.teacher, roster);
    if (scoped.rows.length === 0) throw new AppError(404, "Result not found");
    return {
      ...built,
      columns: scoped.columns,
      rows: scoped.rows,
      rowCount: scoped.rows.length,
      classLabel: scoped.classLabel,
    };
  }
  return built;
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
  const excel = (await resultRepository.findResultSets(where)).map(toResultSetDto);
  const omr = (await listPublishedOmrResultSets(schoolId)).filter((row) => {
    if (testNumber != null && row.testNumber !== testNumber) return false;
    if (type && row.school.type !== type) return false;
    return true;
  });
  const merged = mergeOmrSets(excel, omr);
  return limit ? merged.slice(0, limit) : merged;
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

async function getUploadedResultSet(id: string, actor?: ContentActor) {
  const resultSet = await resultRepository.findResultSet({
    id,
    ...(actor && resultSetAccessFilter(actor)),
  });
  if (!resultSet) throw new AppError(404, "Result not found");
  if (actor?.kind === "teacher" && !resultSetVisibleToTeacher(actor.teacher, resultSet)) {
    throw new AppError(404, "Result not found");
  }
  const dto = withActorSheetFilter(toResultSetDto(resultSet), actor);
  if (actor?.kind === "teacher" && dto.classes.length === 0) {
    throw new AppError(404, "Result not found");
  }
  return dto;
}

async function resolveResultSet(id: string, actor?: ContentActor): Promise<ResultSetDto> {
  const slug = parsePublicSlug(id);
  if (slug) {
    const schoolId = actor ? contentSchool(actor).id : undefined;
    const list = actor
      ? await listVisibleResultSets(actor)
      : mergeOmrSets(
          (await resultRepository.findResultSets({})).map(toResultSetDto),
          await listPublishedOmrResultSets(),
        );
    const hit = list.find(
      (row) => matchesPublicSlug(row, slug) && (!schoolId || row.school.id === schoolId),
    );
    if (!hit) throw new AppError(404, "Result not found");
    return hit;
  }
  if (isOmrResultId(id)) return getOmrResultSet(id, actor);
  return getUploadedResultSet(id, actor);
}

export async function getResultSet(id: string, actor?: ContentActor | SchoolAccountDto) {
  return resolveResultSet(id, toContentActor(actor));
}

async function assertUniqueResultTestId(meta: ResultSetMeta, exceptId?: string) {
  const existing = await resultRepository.findResultSets({
    schoolId: meta.schoolId,
    programKey: meta.programKey,
    testId: meta.testId,
    ...(exceptId ? { id: { not: exceptId } } : {}),
  });
  if (existing.length > 0) {
    throw fieldError(409, "testId", "This test ID already exists for this program. Use a different test ID.");
  }
}

export async function uploadResultSet(fields: ResultSetFields, files?: UploadedFiles) {
  const meta = await resolveMeta(fields);
  await assertUniqueResultTestId(meta);
  const sheets = await readSheets(files);
  requireClasses(sheets.length);

  try {
    const created = await resultRepository.createResultSet(meta, sheets);
    notifyContentChanged({ kind: KIND, schoolId: meta.schoolId });
    return toResultSetDto(created);
  } catch (error) {
    throw duplicateTest(error, meta.testNumber);
  }
}

export async function updateResultSet(id: string, fields: ResultSetFields, files?: UploadedFiles) {
  rejectOmrMutation(id);
  const meta = await resolveMeta(fields);
  await assertUniqueResultTestId(meta, id);
  const sheets = await readSheets(files);

  let resultSet: ResultSetSummary;
  try {
    resultSet = await resultRepository.updateResultSet(id, meta, sheets, fields.removeClasses, requireClasses);
  } catch (error) {
    throw duplicateTest(error, meta.testNumber);
  }
  notifyContentChanged({ kind: KIND, schoolId: resultSet.school.id });
  return toResultSetDto(resultSet);
}

export async function deleteResultSet(id: string) {
  rejectOmrMutation(id);
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

/** Results tab waits until the class teacher publishes. OMR Scan board is the live workspace. */
function omrViewerFor(_actor?: ContentActor): OmScanViewer {
  return { kind: "released" };
}

/** Published OMR scores overlay uploaded sheets. Unpublished scans stay on the OMR board. */
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
      name: scan.student.name,
      subjectScores: scan.subjectScores as SubjectScore[],
      total: scan.total,
      maxTotal: scan.maxTotal,
    })),
  );
}

export async function getResultSheet(params: ResultSheetParams, actor?: ContentActor | SchoolAccountDto) {
  const contentActor = toContentActor(actor);
  const resolved = parsePublicSlug(params.id) ? await resolveResultSet(params.id, contentActor) : null;
  const id = resolved?.id ?? params.id;
  if (isOmrResultId(id) || resolved?.source === "omr") {
    return getOmrResultSheet({ ...params, id }, contentActor);
  }
  assertSheetClassAllowed(params.classLevel, contentActor);
  const sheet = await resultRepository.findResultSheet(sheetWhere({ ...params, id }, contentActor));
  if (!sheet) throw new AppError(404, "Result not found");

  const resultSet = await resultRepository.findResultSet({
    id,
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
    omrViewerFor(contentActor),
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
    rowCount: paper.rows.length,
    updatedAt: updatedAt.toISOString(),
  };
}

export async function getResultSheetFile(
  params: ResultSheetParams,
  actor?: ContentActor | SchoolAccountDto,
) {
  const contentActor = toContentActor(actor);
  const resolved = parsePublicSlug(params.id) ? await resolveResultSet(params.id, contentActor) : null;
  const id = resolved?.id ?? params.id;
  rejectOmrMutation(id);
  assertSheetClassAllowed(params.classLevel, contentActor);
  const file = await resultRepository.findResultSheetFile(sheetWhere({ ...params, id }, contentActor));
  if (!file) throw new AppError(404, "Result not found");
  return file;
}

export async function listVisibleResultSets(actor: ContentActor) {
  const sets = await resultRepository.findResultSets(resultSetAccessFilter(actor));
  const visible = sets.filter((set) =>
    actor.kind === "school" ? true : resultSetVisibleToTeacher(actor.teacher, set),
  );
  const omr = await listPublishedOmrResultSets(contentSchool(actor).id, actor);

  if (actor.kind !== "teacher") {
    return mergeOmrSets(visible.map((set) => withActorSheetFilter(toResultSetDto(set), actor)), omr);
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
  return mergeOmrSets(dtos, omr);
}

export async function countVisibleResultSets(actor: ContentActor) {
  return (await listVisibleResultSets(actor)).length;
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
  rejectOmrMutation(id);
  const resultSet = await resultRepository.setResultSetPublished(id, published);
  if (!resultSet) throw new AppError(404, "Result not found");
  notifyContentChanged({ kind: KIND, schoolId: resultSet.school.id });
  return toResultSetDto(resultSet);
}
