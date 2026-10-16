import type { Metadata } from "next";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { ResourcePage } from "@/features/teachers-resources/resource-page";
import { solutionBooks } from "@/features/teachers-resources/solution-books";

export const metadata: Metadata = {
  title: "Teachers Resources",
  description:
    "Solution books for the Integrated, Advanced, Revised Advanced and Olympiad programs.",
};

export default async function TeachersResourcesPage() {
  const teacher = await verifyTeacherSession();
  const subjectIds = [...new Set(teacher.assignments.map((item) => item.subject))];

  return (
    <ResourcePage
      title="Teachers"
      highlight="Resources"
      books={solutionBooks}
      programIds={teacher.school.programCodes}
      subjectIds={subjectIds}
      assignments={teacher.assignments}
      label="Solution Books"
      emptyMessage="Solution books for your assigned classes and subjects will appear here."
    />
  );
}
