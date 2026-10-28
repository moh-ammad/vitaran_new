import { verifySchoolSession } from "@/features/school-auth/session";
import { verifyStudentSession } from "@/features/student-auth/session";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { SUBJECTS, type Subject } from "@/types/school";
import type { TeacherAssignment } from "@/types/teacher";

export type PortalResourcesPayload = {
  programIds: string[];
  subjectIds: Subject[];
  assignments: TeacherAssignment[];
};

/** School offerings flattened to class+subject pairs (same shape teachers use). */
export async function loadSchoolPortalResources(): Promise<PortalResourcesPayload> {
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

export async function loadTeacherPortalResources(): Promise<PortalResourcesPayload> {
  const teacher = await verifyTeacherSession();
  return {
    programIds: [...new Set(teacher.assignments.map((row) => row.programCode))],
    subjectIds: [...new Set(teacher.assignments.map((row) => row.subject))],
    assignments: teacher.assignments,
  };
}

/** Student sees all subjects for their enrolled program + class. */
export async function loadStudentPortalResources(): Promise<PortalResourcesPayload> {
  const student = await verifyStudentSession();
  const subjectIds = [...SUBJECTS] as Subject[];
  const assignments: TeacherAssignment[] = subjectIds.map((subject) => ({
    programId: student.programId,
    programCode: student.programCode,
    programName: student.programName,
    classLevel: student.classLevel,
    subject,
  }));

  return {
    programIds: [student.programCode],
    subjectIds,
    assignments,
  };
}
