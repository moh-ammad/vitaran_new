import { LiveRefresh } from "@/features/live/live-refresh";
import { verifyStudentSession } from "@/features/student-auth/session";
import { loadStudentTests } from "@/features/student-portal/load";
import { StudentOverview } from "@/features/student-portal/student-overview";

export default async function StudentOverviewPage() {
  const [student, tests] = await Promise.all([verifyStudentSession(), loadStudentTests()]);

  return (
    <>
      <LiveRefresh kind="results" as="student" />
      <StudentOverview student={student} tests={tests} />
    </>
  );
}
