import { PortalResourcesBoard } from "@/features/teachers-resources/portal-resources-board";
import { loadSchoolPortalResources } from "@/features/teachers-resources/portal-resources-data";

export default async function SchoolResourcesPage() {
  const initialPayload = await loadSchoolPortalResources();

  return (
    <PortalResourcesBoard
      role="school"
      description="Solution books for your enrolled programs, classes, and subjects."
      initialPayload={initialPayload}
    />
  );
}
