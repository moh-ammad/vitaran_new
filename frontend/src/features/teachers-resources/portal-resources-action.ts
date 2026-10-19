"use server";

import { verifySchoolSession } from "@/features/school-auth/session";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import type { Subject } from "@/types/school";
import type { TeacherAssignment } from "@/types/teacher";

export type PortalResourcesPayload = {
  programIds: string[];
  subjectIds: Subject[];
  assignments: TeacherAssignment[];
};

/** School offerings flattened to class+subject pairs (same shape teachers use). */
export async function loadSchoolPortalResourcesAction(): Promise<PortalResourcesPayload> {
  const school = await verifySchoolSession();
  const assignments: TeacherAssignment[] = school.schoolPrograms.flatMap((program) =>
    program.classes.flatMap((row) =>
      row.subjects.map((subject) => ({
        programId: program.programId,
        programCode: program.programCode,
        programName: program.programName,
        classLevel: row.classLevel,
        subject,
      })),
    ),
  );

  return {
    programIds: school.programCodes,
    subjectIds: [...new Set(assignments.map((row) => row.subject))],
    assignments,
  };
}

export async function loadTeacherPortalResourcesAction(): Promise<PortalResourcesPayload> {
  const teacher = await verifyTeacherSession();
  return {
    programIds: [...new Set(teacher.assignments.map((row) => row.programCode))],
    subjectIds: [...new Set(teacher.assignments.map((row) => row.subject))],
    assignments: teacher.assignments,
  };
}
