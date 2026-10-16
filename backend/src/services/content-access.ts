import type { Prisma, Subject } from "../generated/prisma/client.js";
import { SchoolType } from "../generated/prisma/enums.js";
import type { SchoolAccountDto } from "./school.service.js";
import type { TeacherAccountDto } from "./teacher.service.js";

/** Signed-in school or teacher — one place for content RBAC. */
export type ContentActor =
  | { kind: "school"; school: SchoolAccountDto }
  | { kind: "teacher"; teacher: TeacherAccountDto };

export function contentSchool(
  actor: ContentActor,
): Pick<SchoolAccountDto, "id" | "type" | "programCodes" | "schoolPrograms"> {
  return actor.kind === "school" ? actor.school : actor.teacher.school;
}

function schoolProgramFilter(
  school: Pick<SchoolAccountDto, "id" | "type" | "programCodes">,
): Prisma.AnswerKeyWhereInput {
  return {
    programCode: { in: school.programCodes },
    ...(school.type === SchoolType.CUSTOMIZED
      ? { schoolId: school.id }
      : { type: SchoolType.REGULAR }),
  };
}

export function answerKeyAccessFilter(actor: ContentActor): Prisma.AnswerKeyWhereInput {
  const school = contentSchool(actor);
  const base: Prisma.AnswerKeyWhereInput = {
    ...schoolProgramFilter(school),
    published: true,
  };

  if (actor.kind === "teacher") {
    const classLevels = teacherClassLevels(actor.teacher);
    if (classLevels.length === 0) return { id: { in: [] } };
    return { ...base, classLevel: { in: classLevels } };
  }

  return base;
}

export function resultSetAccessFilter(actor: ContentActor): Prisma.ResultSetWhereInput {
  return { schoolId: contentSchool(actor).id, published: true };
}

/** Teachers only see sheets for their assigned classes; schools see every class. */
export function resultSheetClassFilter(actor: ContentActor): number[] | null {
  if (actor.kind === "school") return null;
  return teacherClassLevels(actor.teacher);
}

export function teacherSubjects(teacher: TeacherAccountDto): Subject[] {
  return [...new Set(teacher.assignments.map((a) => a.subject))];
}

export function teacherClassLevels(teacher: TeacherAccountDto): number[] {
  return [...new Set(teacher.assignments.map((a) => a.classLevel))];
}
