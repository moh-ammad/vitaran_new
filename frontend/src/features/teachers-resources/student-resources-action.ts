"use server";

import { verifyStudentSession } from "@/features/student-auth/session";
import { SUBJECTS, type Subject } from "@/types/school";
import type { TeacherAssignment } from "@/types/teacher";
import type { PortalResourcesPayload } from "./portal-resources-action";

/** Student sees all subjects for their enrolled program + class. */
export async function loadStudentPortalResourcesAction(): Promise<PortalResourcesPayload> {
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
