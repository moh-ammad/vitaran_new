import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { AnalysisBoard } from "@/features/analysis/analysis-board";
import { getTeacherAnalysis } from "@/services/analysis";

export const metadata: Metadata = { title: "Analysis" };

export default async function TeacherAnalysisPage() {
  const report = await getTeacherAnalysis();

  return (
    <>
      <PageHeader
        title="Analysis"
        description="Your programs and classes, ranked by estimated average. Class teachers see every subject. Subject teachers see only their subject."
      />
      <AnalysisBoard role="teacher" report={report} />
    </>
  );
}
