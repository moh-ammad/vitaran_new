import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { RESULTS_PATH } from "@/features/results/constants";
import { ResultForm } from "@/features/results/result-form";
import { listSchoolOptions } from "@/services/schools";

export const metadata: Metadata = { title: "Upload Results" };

export default async function UploadResultPage({ searchParams }: PageProps<"/admin/results/upload">) {
  const [{ schoolId }, schools] = await Promise.all([searchParams, listSchoolOptions()]);
  const fromSchool =
    typeof schoolId === "string" && schools.some(({ id }) => id === schoolId) ? schoolId : undefined;

  if (!fromSchool) {
    redirect(RESULTS_PATH);
  }

  const school = schools.find(({ id }) => id === fromSchool)!;
  const driveHref =
    school.type === "CUSTOMIZED"
      ? `${RESULTS_PATH}?${new URLSearchParams({ type: "CUSTOMIZED", school: fromSchool })}`
      : RESULTS_PATH;

  return (
    <>
      <PageHeader
        title="Upload results"
        description="Pick a test from this school’s answer keys, then upload Excel sheets for each class."
      />
      <ResultForm schools={schools} defaultSchoolId={fromSchool} backHref={driveHref} />
    </>
  );
}
