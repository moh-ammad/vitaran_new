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
        description="Estimated average across all schools, then program-wise and class-wise. Open a school to go deeper — no student list here."
      />
      <AnalysisBoard role="admin" report={report} />
    </>
  );
}
