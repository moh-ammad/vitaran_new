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
        description="Program-wise and class-wise results with estimated averages. Open a class for student ranking."
      />
      <AnalysisBoard role="school" report={report} />
    </>
  );
}
