import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { RankingBoard } from "@/features/rankings/ranking-board";
import { getSchoolRanking } from "@/services/ranking";

export const metadata: Metadata = { title: "Rankings" };

export default async function SchoolRankingsPage() {
  const report = await getSchoolRanking();

  return (
    <>
      <PageHeader
        title="Rankings"
        description="Overall ranking for the programs and classes assigned to your school, across every school that has published scores."
      />
      <RankingBoard role="school" report={report} />
    </>
  );
}
