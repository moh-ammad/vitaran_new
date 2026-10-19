import { SCHOOL_ANSWER_KEYS_PATH } from "@/features/answer-keys/constants";
import { PortalAnswerKeysBoard } from "@/features/answer-keys/portal-answer-keys-board";
import { verifySchoolSession } from "@/features/school-auth/session";

export default async function SchoolAnswerKeysPage() {
  const school = await verifySchoolSession();

  return (
    <PortalAnswerKeysBoard
      role="school"
      basePath={SCHOOL_ANSWER_KEYS_PATH}
      programIds={school.programCodes}
      description="Published answer keys for your programs."
    />
  );
}
