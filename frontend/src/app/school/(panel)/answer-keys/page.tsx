import { SCHOOL_ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { PortalAnswerKeysBoard } from "@/features/answer-keys/portal-answer-keys-board";
import { verifySchoolSession } from "@/features/school-auth/session";
import { listSchoolAnswerKeys } from "@/services/answer-keys";

export default async function SchoolAnswerKeysPage() {
  const [school, documents] = await Promise.all([verifySchoolSession(), listSchoolAnswerKeys()]);

  return (
    <PortalAnswerKeysBoard
      role="school"
      basePath={SCHOOL_ANSWER_KEYS_PATH}
      programIds={school.programCodes}
      description="Published answer keys for your programs."
      initialDocuments={documents}
    />
  );
}
