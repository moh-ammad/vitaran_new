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
import { toSchoolRef, type SchoolAccountDto } from "./school.service.js";

const KIND = "results";

export type UploadedFiles = Partial<Record<string, Express.Multer.File[]>>;

type FieldIssue = { path: [string]; message: string };

const fieldError = (status: number, path: string, message: string) =>
  new AppError(status, message, [{ path: [path], message }] satisfies FieldIssue[]);

function toResultSetDto({ school, sheets, createdAt, updatedAt, publishedAt, ...rest }: ResultSetSummary) {
  return {
    ...rest,
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
async function resolveMeta({ schoolId, program, programName, testNumber }: ResultSetFields): Promise<ResultSetMeta> {
  const school = await schoolRepository.findSchoolById(schoolId);
  if (!school) throw fieldError(400, "schoolId", "Select a school");

  if (school.type === SchoolType.CUSTOMIZED) {
    if (!programName) throw fieldError(400, "programName", "Enter the program name");
    return {
      schoolId,
      program: null,
      programName,
      programKey: `custom:${programName.toLowerCase().replace(/\s+/g, " ")}`,
      testNumber,
    };
  }

  if (!program) throw fieldError(400, "program", "Select a program");
  if (!school.programs.includes(program)) {
    throw fieldError(400, "program", "This school isn't enrolled in that program");
  }
  return { schoolId, program, programName: null, programKey: program, testNumber };
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
  return { total: await resultRepository.countResultSets() };
}

/** Schools only reach their own results, and only once the admin has published them. */
const schoolScope = (school: SchoolAccountDto) => ({ schoolId: school.id, published: true });

export async function getResultSet(id: string, school?: SchoolAccountDto) {
  const resultSet = await resultRepository.findResultSet({ id, ...(school && schoolScope(school)) });
  if (!resultSet) throw new AppError(404, "Result not found");
  return toResultSetDto(resultSet);
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

const sheetWhere = ({ id, classLevel }: ResultSheetParams, school?: SchoolAccountDto) => ({
  classLevel,
  resultSet: { id, ...(school && schoolScope(school)) },
});

export async function getResultSheet(params: ResultSheetParams, school?: SchoolAccountDto) {
  const sheet = await resultRepository.findResultSheet(sheetWhere(params, school));
  if (!sheet) throw new AppError(404, "Result not found");

  const { rows, columns, updatedAt, ...rest } = sheet;
  return {
    ...rest,
    columns: columns as string[],
    rows: rows.map(({ values }) => values as CellValue[]),
    updatedAt: updatedAt.toISOString(),
  };
}

export async function getResultSheetFile(params: ResultSheetParams, school?: SchoolAccountDto) {
  const file = await resultRepository.findResultSheetFile(sheetWhere(params, school));
  if (!file) throw new AppError(404, "Result not found");
  return file;
}

export async function listSchoolResultSets(school: SchoolAccountDto) {
  return (await resultRepository.findResultSets(schoolScope(school))).map(toResultSetDto);
}

export async function setResultSetPublished(id: string, published: boolean) {
  const resultSet = await resultRepository.setResultSetPublished(id, published);
  if (!resultSet) throw new AppError(404, "Result not found");
  notifyContentChanged({ kind: KIND, schoolId: resultSet.school.id });
  return toResultSetDto(resultSet);
}
