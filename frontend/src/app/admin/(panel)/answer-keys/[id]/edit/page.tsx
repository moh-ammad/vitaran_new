import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { AnswerKeyForm } from "@/features/answer-keys/answer-key-form";
import { getAnswerKey } from "@/services/answer-keys";
import { listCustomizedSchoolOptions } from "@/services/schools";

export const metadata: Metadata = { title: "Edit Answer Key" };

export default async function EditAnswerKeyPage({ params }: PageProps<"/admin/answer-keys/[id]/edit">) {
  const { id } = await params;
  const [answerKey, schools] = await Promise.all([getAnswerKey(id), listCustomizedSchoolOptions()]);
  if (!answerKey) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Edit answer key"
        description="Update the details or replace the PDF. Changes show up in Recent uploads."
      />
      <AnswerKeyForm schools={schools} answerKey={answerKey} />
    </div>
  );
}
