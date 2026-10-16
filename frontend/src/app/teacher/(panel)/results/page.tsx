import { PageHeader } from "@/features/admin/page-header";
import { TEACHER_RESULTS_PATH } from "@/features/results/constants";
import { SchoolResults } from "@/features/results/school-results";
import { listTeacherResultSets } from "@/services/results";

export default async function TeacherResultsPage() {
  const resultSets = await listTeacherResultSets();

  return (
    <>
      <PageHeader
        title="Results"
        count={resultSets.length}
        description="Published results for your assigned classes."
      />
      <SchoolResults resultSets={resultSets} basePath={TEACHER_RESULTS_PATH} />
    </>
  );
}
