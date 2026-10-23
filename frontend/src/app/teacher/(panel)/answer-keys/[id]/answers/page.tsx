import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { LiveAnswerKeyViewer } from "@/features/answer-keys/live-answer-key-viewer";
import { getTeacherAnswerKey } from "@/services/answer-keys";

export const metadata: Metadata = { title: "Key corrections" };
export const maxDuration = 300;

export default async function TeacherAnswerKeyAnswersPage({
  params,
}: PageProps<"/teacher/answer-keys/[id]/answers">) {
  const { id } = await params;
  const answerKey = await getTeacherAnswerKey(id);
  if (!answerKey) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Key corrections"
        description={`${answerKey.fileName} · Test ID ${answerKey.testId}. Only options admin changed. Follow the PDF for the rest.`}
      />
      <LiveAnswerKeyViewer role="teacher" answerKey={answerKey} />
    </div>
  );
}
