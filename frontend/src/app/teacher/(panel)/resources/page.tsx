import { PortalResourcesBoard } from "@/features/teachers-resources/portal-resources-board";
import { verifyTeacherSession } from "@/features/teacher-auth/session";

export default async function TeacherResourcesPage() {
  await verifyTeacherSession();

  return (
    <PortalResourcesBoard
      role="teacher"
      description="Solution books for your assigned programs, classes, and subjects."
    />
  );
}
