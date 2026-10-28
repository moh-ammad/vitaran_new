import { PortalResourcesBoard } from "@/features/teachers-resources/portal-resources-board";
import { loadStudentPortalResources } from "@/features/teachers-resources/portal-resources-data";

export default async function StudentResourcesPage() {
  const initialPayload = await loadStudentPortalResources();

  return (
    <PortalResourcesBoard
      role="student"
      description="Solution books for your program and class."
      initialPayload={initialPayload}
    />
  );
}
