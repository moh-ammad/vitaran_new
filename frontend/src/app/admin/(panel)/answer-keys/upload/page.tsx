import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { AnswerKeyForm } from "@/features/answer-keys/answer-key-form";
import { listPrograms } from "@/services/programs";
import { listCustomizedSchoolOptions } from "@/services/schools";

export const metadata: Metadata = { title: "Upload Answer Key" };

export default async function UploadAnswerKeyPage() {
  const [schools, programs] = await Promise.all([
    listCustomizedSchoolOptions(),
    listPrograms(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Upload answer key"
        description="Choose the program, type, test and class, then attach the PDF."
      />
      <AnswerKeyForm schools={schools} programs={programs} />
    </div>
  );
}
