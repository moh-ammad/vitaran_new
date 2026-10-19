import { TEACHER_ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { PortalAnswerKeysBoard } from "@/features/answer-keys/portal-answer-keys-board";
import { verifyTeacherSession } from "@/features/teacher-auth/session";

export default async function TeacherAnswerKeysPage() {
  const teacher = await verifyTeacherSession();

  const programCodes =
    teacher.assignments.length > 0
      ? [...new Set(teacher.assignments.map((row) => row.programCode))]
      : teacher.school.programCodes;

  return (
    <PortalAnswerKeysBoard
      role="teacher"
      basePath={TEACHER_ANSWER_KEYS_PATH}
      programIds={programCodes}
      description="Published answer keys for your assigned classes."
      hideIdBadgeOnMobile
    />
  );
}
