import type { Metadata } from "next";
import { verifySchoolSession } from "@/features/school-auth/session";
import { ResourcePage } from "@/features/teachers-resources/resource-page";
import { solutionBooks } from "@/features/teachers-resources/solution-books";

export const metadata: Metadata = {
  title: "Teachers Resources",
  description:
    "Solution books for the Integrated, Advanced, Revised Advanced and Olympiad programs.",
};

export default async function TeachersResourcesPage() {
  const school = await verifySchoolSession();

  return (
    <ResourcePage
      title="Teachers"
      highlight="Resources"
      subtitle="Please navigate through the below tabs for Solution Books"
      books={solutionBooks}
      programIds={school.programs}
      label="Solution Books"
      emptyMessage="Solution books for this program will be available here soon."
    />
  );
}
