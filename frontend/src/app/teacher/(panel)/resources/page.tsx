import { PortalResourcesBoard } from "@/features/teachers-resources/portal-resources-board";
import { loadTeacherPortalResources } from "@/features/teachers-resources/portal-resources-data";

export default async function TeacherResourcesPage() {
  const initialPayload = await loadTeacherPortalResources();

  return (
    <PortalResourcesBoard
      role="teacher"
      description="Solution books for your assigned programs, classes, and subjects."
      initialPayload={initialPayload}
    />
  );
}
