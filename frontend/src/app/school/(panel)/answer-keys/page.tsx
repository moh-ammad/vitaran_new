import { PageHeader } from "@/features/admin/page-header";
import { ANSWER_KEY_NOUN, SCHOOL_ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { SchoolDocuments } from "@/features/documents/school-documents";
import { verifySchoolSession } from "@/features/school-auth/session";
import { listSchoolAnswerKeys } from "@/services/answer-keys";

export default async function SchoolAnswerKeysPage() {
  const [school, answerKeys] = await Promise.all([verifySchoolSession(), listSchoolAnswerKeys()]);

  return (
    <>
      <PageHeader
        title="Answer keys"
        count={answerKeys.length}
        description="Published answer keys for your programs."
      />
      <SchoolDocuments
        programIds={school.programCodes}
        documents={answerKeys}
        noun={ANSWER_KEY_NOUN}
        basePath={SCHOOL_ANSWER_KEYS_PATH}
      />
    </>
  );
}
