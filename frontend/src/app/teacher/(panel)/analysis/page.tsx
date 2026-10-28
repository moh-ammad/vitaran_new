import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { AnalysisBoard } from "@/features/analysis/analysis-board";
import { TEACHER_ANALYSIS_PATH, analysisApiQuery } from "@/features/analysis/query";
import { LiveRefresh } from "@/features/live/live-refresh";
import { getTeacherAnalysis } from "@/services/analysis";

export const metadata: Metadata = { title: "Analysis" };

export default async function TeacherAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; class?: string; section?: string; test?: string }>;
}) {
  const query = await searchParams;
  const report = await getTeacherAnalysis(analysisApiQuery(query));

  return (
    <>
      <LiveRefresh kind="results" />
      <PageHeader
        title="Analysis"
        description="Class teachers see every subject. Subject teachers see only their subject. Compare tests and spot weak areas."
      />
      <AnalysisBoard role="teacher" basePath={TEACHER_ANALYSIS_PATH} report={report} />
    </>
  );
}
