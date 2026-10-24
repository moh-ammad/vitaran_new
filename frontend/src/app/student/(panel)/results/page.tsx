import { PageHeader } from "@/features/admin/page-header";
import { LiveRefresh } from "@/features/live/live-refresh";
import { loadStudentTests } from "@/features/student-portal/load";
import { StudentTestList } from "@/features/student-portal/student-test-list";

export default async function StudentResultsPage() {
  const tests = await loadStudentTests();

  return (
    <>
      <LiveRefresh kind="results" as="student" />
      <PageHeader
        title="Results"
        count={tests.length}
        description="Published scores. Open a test to see explanations against the key."
      />
      <StudentTestList tests={tests} />
    </>
  );
}
