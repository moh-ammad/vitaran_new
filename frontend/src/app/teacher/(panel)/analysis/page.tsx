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
        description="Your classes ranked by estimated average. Open a class for student ranking. Class teachers see every subject; subject teachers see only theirs."
      />
      <AnalysisBoard role="teacher" report={report} />
    </>
  );
}
