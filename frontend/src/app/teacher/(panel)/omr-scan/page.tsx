import { PageHeader } from "@/features/admin/page-header";
import { OmrScanBoard } from "@/features/omr/omr-scan-board";
import { listOmResultReleases, listTeacherOmScans } from "@/services/om-scans";

export default async function TeacherOmrScanPage() {
  const [scans, releases] = await Promise.all([listTeacherOmScans(), listOmResultReleases()]);

  return (
    <>
      <PageHeader title="OMR Scan" />
      <OmrScanBoard initial={scans} releases={releases} />
    </>
  );
}
