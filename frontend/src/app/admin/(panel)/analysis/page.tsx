import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { AnalysisBoard } from "@/features/analysis/analysis-board";
import { ADMIN_ANALYSIS_PATH, analysisApiQuery } from "@/features/analysis/query";
import { LiveRefresh } from "@/features/live/live-refresh";
import { getAdminAnalysis } from "@/services/analysis";

export const metadata: Metadata = { title: "Analysis" };

export default async function AdminAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string; program?: string; class?: string; section?: string; test?: string }>;
}) {
  const query = await searchParams;
  const report = await getAdminAnalysis(analysisApiQuery(query));

  return (
    <>
      <LiveRefresh kind="results" as="admin" />
      <PageHeader
        title="Analysis"
        description="Live school-wise performance from the latest OMR scans and uploaded sheets. OMR wins when both exist."
      />
      <AnalysisBoard role="admin" basePath={ADMIN_ANALYSIS_PATH} report={report} />
    </>
  );
}
