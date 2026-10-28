import { SCHOOL_RESULTS_PATH } from "@/features/results/constants";
import { PortalResultsBoard } from "@/features/results/portal-results-board";

export default async function SchoolResultsPage() {
  return (
    <PortalResultsBoard
      role="school"
      basePath={SCHOOL_RESULTS_PATH}
      description="OMR scores update these sheets as class teachers scan, even before they publish to students."
      emptyHint="Uploaded sheets appear here. OMR scores overlay them as soon as class teachers scan — Analysis covers OMR-only tests too."
    />
  );
}
