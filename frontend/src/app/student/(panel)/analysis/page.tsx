import { PageHeader } from "@/features/admin/page-header";
import { LiveRefresh } from "@/features/live/live-refresh";
import { loadStudentTests } from "@/features/student-portal/load";
import { StudentAnalysisBoard } from "@/features/student-portal/student-analysis";

export default async function StudentAnalysisPage() {
  const tests = await loadStudentTests();

  return (
    <>
      <LiveRefresh kind="results" as="student" />
      <PageHeader
        title="Analysis"
        description="Your published tests: overall average, test-wise and subject-wise bar and pie charts, and past vs latest."
      />
      <StudentAnalysisBoard tests={tests} />
    </>
  );
}
