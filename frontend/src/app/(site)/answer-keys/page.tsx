import type { Metadata } from "next";
import { ANSWER_KEY_NOUN, TEACHER_ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { SchoolDocumentsPage } from "@/features/documents/school-documents-page";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { listTeacherAnswerKeys } from "@/services/answer-keys";

export const metadata: Metadata = {
  title: "Answer Keys",
  description:
    "Answer keys for the Integrated, Advanced, Revised Advanced and Olympiad programs.",
};

export default async function AnswerKeysPage() {
  const [teacher, answerKeys] = await Promise.all([
    verifyTeacherSession(),
    listTeacherAnswerKeys(),
  ]);

  return (
    <SchoolDocumentsPage
      title="Answer"
      highlight="Keys"
      programIds={teacher.school.programCodes}
      documents={answerKeys}
      noun={ANSWER_KEY_NOUN}
      basePath={TEACHER_ANSWER_KEYS_PATH}
    />
  );
}
