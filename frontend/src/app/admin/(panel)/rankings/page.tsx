import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { RankingBoard } from "@/features/rankings/ranking-board";
import { getAdminRanking } from "@/services/ranking";

export const metadata: Metadata = { title: "Rankings" };

export default async function AdminRankingsPage() {
  const report = await getAdminRanking();

  return (
    <>
      <PageHeader
        title="Rankings"
        description="Overall performance by program and class, across schools. Open a test or view the average of every published test."
      />
      <RankingBoard role="admin" report={report} />
    </>
  );
}
