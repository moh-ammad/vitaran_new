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
      books={solutionBooks}
      programIds={school.programs}
      subjectIds={school.subjects}
      label="Solution Books"
      emptyMessage="Solution books for your subjects in this program will be available here soon."
    />
  );
}
