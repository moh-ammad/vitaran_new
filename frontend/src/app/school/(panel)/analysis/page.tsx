import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { AnalysisBoard } from "@/features/analysis/analysis-board";
import { SCHOOL_ANALYSIS_PATH, analysisApiQuery } from "@/features/analysis/query";
import { LiveRefresh } from "@/features/live/live-refresh";
import { getSchoolAnalysis } from "@/services/analysis";

export const metadata: Metadata = { title: "Analysis" };

export default async function SchoolAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; class?: string; section?: string; test?: string }>;
}) {
  const query = await searchParams;
  const report = await getSchoolAnalysis(analysisApiQuery(query));

  return (
    <>
      <LiveRefresh kind="results" />
      <PageHeader
        title="Analysis"
        description="Class, section, program, and student performance from OMR scans and uploaded sheets — including scores not yet published to students."
      />
      <AnalysisBoard role="school" basePath={SCHOOL_ANALYSIS_PATH} report={report} />
    </>
  );
}
