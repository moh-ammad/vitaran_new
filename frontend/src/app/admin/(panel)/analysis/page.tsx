import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { AnalysisBoard } from "@/features/analysis/analysis-board";
import { getAdminAnalysis } from "@/services/analysis";

export const metadata: Metadata = { title: "Analysis" };

export default async function AdminAnalysisPage() {
  const report = await getAdminAnalysis();

  return (
    <>
      <PageHeader
        title="Analysis"
        description="School, program, and class ranking with estimated averages. Student-wise analysis stays with the school and class teacher."
      />
      <AnalysisBoard role="admin" report={report} />
    </>
  );
}
