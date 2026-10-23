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
        description="Right vs wrong, past vs latest, and subject filters on your published tests."
      />
      <StudentAnalysisBoard tests={tests} />
    </>
  );
}
