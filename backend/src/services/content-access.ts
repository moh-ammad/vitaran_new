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

function ownershipFilter(
  school: Pick<SchoolAccountDto, "id" | "type">,
): Prisma.AnswerKeyWhereInput {
  return school.type === SchoolType.CUSTOMIZED
    ? { schoolId: school.id }
    : { type: SchoolType.REGULAR };
}

/** One OR branch per enrolled/assigned program+class — avoids cross-program class leaks. */
function programClassSlots(
  slots: Array<{ programCode: string; classLevel: number }>,
): Prisma.AnswerKeyWhereInput[] {
  const seen = new Set<string>();
  const branches: Prisma.AnswerKeyWhereInput[] = [];
  for (const slot of slots) {
    const key = `${slot.programCode}:${slot.classLevel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    branches.push({ programCode: slot.programCode, classLevel: slot.classLevel });
  }
  return branches;
}

export function answerKeyAccessFilter(actor: ContentActor): Prisma.AnswerKeyWhereInput {
  const school = contentSchool(actor);
  const ownership = ownershipFilter(school);

  if (actor.kind === "teacher") {
    const slots = programClassSlots(
      actor.teacher.assignments.map((row) => ({
        programCode: row.programCode,
        classLevel: row.classLevel,
      })),
    );
    if (slots.length === 0) return { id: { in: [] } };
    return { published: true, ...ownership, OR: slots };
  }

  const slots = programClassSlots(
    school.schoolPrograms.flatMap((program) =>
      program.classes.map((cls) => ({
        programCode: program.programCode,
        classLevel: cls.classLevel,
      })),
    ),
  );
  if (slots.length === 0) return { id: { in: [] } };
  return { published: true, ...ownership, OR: slots };
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
