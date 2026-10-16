import { PageHeader } from "@/features/admin/page-header";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { ResourcePage } from "@/features/teachers-resources/resource-page";
import { solutionBooks } from "@/features/teachers-resources/solution-books";

export default async function TeacherResourcesPage() {
  const teacher = await verifyTeacherSession();
  const programCodes = [...new Set(teacher.assignments.map((row) => row.programCode))];
  const subjectIds = [...new Set(teacher.assignments.map((row) => row.subject))];

  return (
    <>
      <PageHeader
        title="Resources"
        description="Solution books for your assigned programs and subjects."
      />
      <div className="-mx-4 -mb-4 sm:-mx-5 lg:-mx-6">
        <ResourcePage
          title="Teachers"
          highlight="Resources"
          books={solutionBooks}
          programIds={programCodes}
          subjectIds={subjectIds}
          label="Solution Books"
          emptyMessage="Solution books for your subjects in this program will be available here soon."
          compact
        />
      </div>
    </>
  );
}
