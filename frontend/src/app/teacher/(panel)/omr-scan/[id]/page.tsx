import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { OmScorecard } from "@/features/omr/scorecard";
import { getTeacherOmScan } from "@/services/om-scans";

export default async function TeacherOmScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let scan;
  try {
    scan = await getTeacherOmScan(id);
  } catch {
    notFound();
  }

  return (
    <>
      <PageHeader title="Student scorecard" description={`Test ID ${scan.testId}`} />
      <OmScorecard scan={scan} />
    </>
  );
}
