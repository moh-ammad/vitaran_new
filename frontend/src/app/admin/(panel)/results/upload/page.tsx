import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { ResultForm } from "@/features/results/result-form";
import { listSchoolOptions } from "@/services/schools";

export const metadata: Metadata = { title: "Upload Results" };

export default async function UploadResultPage({ searchParams }: PageProps<"/admin/results/upload">) {
  const [{ schoolId }, schools] = await Promise.all([searchParams, listSchoolOptions()]);
  const fromSchool = typeof schoolId === "string" && schools.some(({ id }) => id === schoolId) ? schoolId : undefined;

  return (
    <>
      <PageHeader
        title="Upload results"
        description="Choose the school, program and test, then upload an Excel sheet for each class."
      />
      <ResultForm
        schools={schools}
        defaultSchoolId={fromSchool}
        backHref={fromSchool ? `/admin/schools/${fromSchool}` : undefined}
      />
    </>
  );
}
