import { PageHeader } from "@/features/admin/page-header";
import { SCHOOL_RESULTS_PATH } from "@/features/results/constants";
import { SchoolResults } from "@/features/results/school-results";
import { listSchoolResultSets } from "@/services/results";

export default async function SchoolResultsPage() {
  const resultSets = await listSchoolResultSets();

  return (
    <>
      <PageHeader
        title="Results"
        count={resultSets.length}
        description="Published results for your school."
      />
      <SchoolResults resultSets={resultSets} basePath={SCHOOL_RESULTS_PATH} />
    </>
  );
}
