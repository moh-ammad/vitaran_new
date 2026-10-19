import { TEACHER_RESULTS_PATH } from "@/features/results/constants";
import { PortalResultsBoard } from "@/features/results/portal-results-board";
import { verifyTeacherSession } from "@/features/teacher-auth/session";

export default async function TeacherResultsPage() {
  await verifyTeacherSession();
  return (
    <PortalResultsBoard
      role="teacher"
      basePath={TEACHER_RESULTS_PATH}
      description="Published results for your assigned classes."
    />
  );
}
