import { SCHOOL_RESULTS_PATH } from "@/features/results/constants";
import { PortalResultsBoard } from "@/features/results/portal-results-board";
import { listSchoolResultSets } from "@/services/results";

export default async function SchoolResultsPage() {
  const resultSets = await listSchoolResultSets();

  return (
    <PortalResultsBoard
      role="school"
      basePath={SCHOOL_RESULTS_PATH}
      description="Published test results for your school. Class teachers publish OMR from the scan board."
      emptyHint="Results appear here after a sheet is uploaded or a class teacher publishes OMR scans."
      initialResultSets={resultSets}
    />
  );
}
