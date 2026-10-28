import { TEACHER_RESULTS_PATH } from "@/features/results/constants";
import { PortalResultsBoard } from "@/features/results/portal-results-board";

export default async function TeacherResultsPage() {
  return (
    <PortalResultsBoard
      role="teacher"
      basePath={TEACHER_RESULTS_PATH}
      description="Published results for your classes. Class teachers see every subject. Subject teachers see only their subject. Unpublished scans stay on OMR Scan."
      emptyHint="Results appear here after you publish OMR scans, or after uploaded sheets are published."
    />
  );
}
