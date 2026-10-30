import type { Metadata } from "next";
import { PageHeader } from "@/features/admin/page-header";
import { RankingBoard } from "@/features/rankings/ranking-board";
import { getTeacherRanking } from "@/services/ranking";

export const metadata: Metadata = { title: "Rankings" };

export default async function TeacherRankingsPage() {
  const report = await getTeacherRanking();

  return (
    <>
      <PageHeader
        title="Rankings"
        description="Class teachers see overall marks for their class and program across schools. Subject teachers see only their subject."
      />
      <RankingBoard role="teacher" report={report} />
    </>
  );
}
