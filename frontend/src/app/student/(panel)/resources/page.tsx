import { PortalResourcesBoard } from "@/features/teachers-resources/portal-resources-board";

export default async function StudentResourcesPage() {
  return (
    <PortalResourcesBoard
      role="student"
      description="Solution books for your program and class."
    />
  );
}
