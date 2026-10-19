import { PortalResourcesBoard } from "@/features/teachers-resources/portal-resources-board";
import { verifyStudentSession } from "@/features/student-auth/session";

export default async function StudentResourcesPage() {
  await verifyStudentSession();

  return (
    <PortalResourcesBoard
      role="student"
      description="Solution books for your program and class."
    />
  );
}
