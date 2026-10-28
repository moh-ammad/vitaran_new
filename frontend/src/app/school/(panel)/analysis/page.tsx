import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { AnalysisBoard } from "@/features/analysis/analysis-board";
import { getSchoolAnalysis } from "@/services/analysis";

export const metadata: Metadata = { title: "Analysis" };

export default async function SchoolAnalysisPage() {
  const report = await getSchoolAnalysis();

  return (
    <>
      <PageHeader
        title="Analysis"
        description="Class-wise ranking and estimated average. Open a class for student ranking, then a student for their charts."
      />
      <AnalysisBoard role="school" report={report} />
    </>
  );
}
