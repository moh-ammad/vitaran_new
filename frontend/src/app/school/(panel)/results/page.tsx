import { SCHOOL_RESULTS_PATH } from "@/features/results/constants";
import { PortalResultsBoard } from "@/features/results/portal-results-board";

export default async function SchoolResultsPage() {
  return (
    <PortalResultsBoard
      role="school"
      basePath={SCHOOL_RESULTS_PATH}
      description="Published test results for your school. Class teachers publish OMR from the scan board."
      emptyHint="Results appear here after a sheet is uploaded or a class teacher publishes OMR scans."
    />
  );
}
