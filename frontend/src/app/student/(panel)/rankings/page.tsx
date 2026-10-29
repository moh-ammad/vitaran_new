import { PageHeader } from "@/features/admin/page-header";
import { RankingBoard } from "@/features/rankings/ranking-board";
import { getStudentRanking } from "@/services/ranking";

export default async function StudentRankingsPage() {
  const report = await getStudentRanking();

  return (
    <>
      <PageHeader
        title="Class ranking"
        description="Your place in your program and class. Switch between the latest test and your overall average."
      />
      <RankingBoard role="student" report={report} />
    </>
  );
}
