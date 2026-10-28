import { programLabel } from "@/features/schools/constants";
import type { ResultSet } from "@/types/result";

export const RESULTS_PATH = "/admin/results";
export const RESULT_UPLOAD_PATH = `${RESULTS_PATH}/upload`;
/** School portal results. */
export const SCHOOL_RESULTS_PATH = "/school/results";

/** Teacher portal results. */
export const TEACHER_RESULTS_PATH = "/teacher/results";

export const EXCEL_MAX_BYTES = 2 * 1024 * 1024;
export const EXCEL_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type ClassLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Multipart field carrying a class's spreadsheet; the API expects the same names. */
export const classFileField = (level: number) => `class_${level}` as `class_${ClassLevel}`;

/** Upload form with the school pre-selected; it returns to the school's page afterwards. */
export const resultUploadHrefFor = (schoolId: string) =>
  `${RESULT_UPLOAD_PATH}?${new URLSearchParams({ schoolId })}`;

/** School/teacher URLs: `ADVANCED~23462`. Admin keeps the database id. */
export function resultPublicSlug(resultSet: Pick<ResultSet, "program" | "programName" | "testId">) {
  const program = (resultSet.program || resultSet.programName || "test")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "TEST";
  return `${program}~${resultSet.testId.trim()}`;
}

function resultLinkId(basePath: string, resultSet: ResultSet) {
  return basePath === RESULTS_PATH ? resultSet.id : resultPublicSlug(resultSet);
}

/** `basePath` is `/admin/results`, `/school/results`, or `/teacher/results`. */
export const resultSetHref = (basePath: string, resultSet: ResultSet | string, classLevel?: number) => {
  const id = typeof resultSet === "string" ? resultSet : resultLinkId(basePath, resultSet);
  const path = `${basePath}/${encodeURIComponent(id)}`;
  return classLevel ? `${path}?class=${classLevel}` : path;
};
export const resultEditHref = (id: string) => `${RESULTS_PATH}/${id}/edit`;
export const resultSheetDownloadHref = (basePath: string, id: string, classLevel: number) =>
  `${basePath}/${encodeURIComponent(id)}/classes/${classLevel}/file`;

export const resultProgramLabel = ({ program, programName }: Pick<ResultSet, "program" | "programName">) =>
  program ? programLabel(program) : (programName ?? "");

export const studentCount = (count: number) => `${count} ${count === 1 ? "student" : "students"}`;
