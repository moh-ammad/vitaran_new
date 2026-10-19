import { PortalResourcesBoard } from "@/features/teachers-resources/portal-resources-board";
import { verifySchoolSession } from "@/features/school-auth/session";

export default async function SchoolResourcesPage() {
  await verifySchoolSession();

  return (
    <PortalResourcesBoard
      role="school"
      description="Solution books for your enrolled programs, classes, and subjects."
    />
  );
}
