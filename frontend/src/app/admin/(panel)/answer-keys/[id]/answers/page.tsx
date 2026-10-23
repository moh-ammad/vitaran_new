import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { AnswerKeyAnswersEditor } from "@/features/answer-keys/answer-key-answers-editor";
import { getAnswerKey } from "@/services/answer-keys";

export const metadata: Metadata = { title: "Edit answers" };
export const maxDuration = 300;

export default async function AnswerKeyAnswersPage({
  params,
}: PageProps<"/admin/answer-keys/[id]/answers">) {
  const { id } = await params;
  const answerKey = await getAnswerKey(id);
  if (!answerKey) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Edit answers"
        description={`${answerKey.fileName} · Test ID ${answerKey.testId}. Each subject is a separate section.`}
      />
      <AnswerKeyAnswersEditor answerKey={answerKey} />
    </div>
  );
}
