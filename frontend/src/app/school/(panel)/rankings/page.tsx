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
        description="Performance for your programs and classes. Pick the latest test, an earlier test, or the overall average."
      />
      <RankingBoard role="school" report={report} />
    </>
  );
}
