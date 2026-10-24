import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { setAnswerKeyPublishedAction } from "@/features/answer-keys/actions";
import { AnswerKeysDrive, type DrivePath } from "@/features/answer-keys/answer-keys-drive";
import { AnswerKeysFilters } from "@/features/answer-keys/answer-keys-filters";
import { parseListFilters } from "@/features/documents/list-filters";
import { listRecentAnswerKeys } from "@/services/answer-keys";
import { listPrograms } from "@/services/programs";
import { listSchoolOptions } from "@/services/schools";

export const metadata: Metadata = { title: "Answer Keys" };

export default async function AdminAnswerKeysPage({ searchParams }: PageProps<"/admin/answer-keys">) {
  const [schools, programs] = await Promise.all([listSchoolOptions(), listPrograms()]);
  const filters = parseListFilters(await searchParams, {
    programCodes: programs.map((program) => program.code),
  });
  const answerKeys = await listRecentAnswerKeys({ ...filters, limit: 100 });

  const path: DrivePath = {
    program: filters.type === "REGULAR" ? filters.program : undefined,
    schoolId: filters.type === "CUSTOMIZED" ? filters.schoolId : undefined,
    testNumber: filters.testNumber,
  };

  return (
    <>
      <PageHeader
        title="Answer Keys"
        toolbar={<AnswerKeysFilters path={path} programs={programs} schools={schools} />}
      />
      <AnswerKeysDrive
        items={answerKeys}
        programs={programs}
        schools={schools}
        path={path}
        publishAction={setAnswerKeyPublishedAction}
      />
    </>
  );
}
