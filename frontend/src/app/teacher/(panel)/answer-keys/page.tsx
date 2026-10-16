import { PageHeader } from "@/features/admin/page-header";
import { ANSWER_KEY_NOUN, TEACHER_ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { SchoolDocuments } from "@/features/documents/school-documents";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { listTeacherAnswerKeys } from "@/services/answer-keys";

export default async function TeacherAnswerKeysPage() {
  const [teacher, answerKeys] = await Promise.all([
    verifyTeacherSession(),
    listTeacherAnswerKeys(),
  ]);

  const programCodes =
    teacher.assignments.length > 0
      ? [...new Set(teacher.assignments.map((row) => row.programCode))]
      : teacher.school.programCodes;

  return (
    <>
      <PageHeader
        title="Answer keys"
        count={answerKeys.length}
        description="Published answer keys for your assigned classes."
      />
      <SchoolDocuments
        programIds={programCodes}
        documents={answerKeys}
        noun={ANSWER_KEY_NOUN}
        basePath={TEACHER_ANSWER_KEYS_PATH}
      />
    </>
  );
}
