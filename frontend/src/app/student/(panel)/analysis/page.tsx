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
        description="Overall average across every published test, plus past vs latest and which subjects need work."
      />
      <StudentAnalysisBoard tests={tests} />
    </>
  );
}
