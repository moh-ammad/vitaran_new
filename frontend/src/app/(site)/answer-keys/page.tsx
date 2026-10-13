import type { Metadata } from "next";
import { ANSWER_KEY_NOUN, SCHOOL_ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { SchoolDocumentsPage } from "@/features/documents/school-documents-page";
import { verifySchoolSession } from "@/features/school-auth/session";
import { listSchoolAnswerKeys } from "@/services/answer-keys";

export const metadata: Metadata = {
  title: "Answer Keys",
  description:
    "Answer keys for the Integrated, Advanced, Revised Advanced and Olympiad programs.",
};

export default async function AnswerKeysPage() {
  const [school, answerKeys] = await Promise.all([verifySchoolSession(), listSchoolAnswerKeys()]);

  return (
    <SchoolDocumentsPage
      title="Answer"
      highlight="Keys"
      programIds={school.programs}
      documents={answerKeys}
      noun={ANSWER_KEY_NOUN}
      basePath={SCHOOL_ANSWER_KEYS_PATH}
    />
  );
}
