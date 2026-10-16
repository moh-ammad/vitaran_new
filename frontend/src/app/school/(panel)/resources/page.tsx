import { PageHeader } from "@/features/admin/page-header";
import { uniqueSubjectsFromOfferings } from "@/features/schools/offerings";
import { verifySchoolSession } from "@/features/school-auth/session";
import { ResourcePage } from "@/features/teachers-resources/resource-page";
import { solutionBooks } from "@/features/teachers-resources/solution-books";

export default async function SchoolResourcesPage() {
  const school = await verifySchoolSession();

  return (
    <>
      <PageHeader title="Resources" description="Solution books for your programs and subjects." />
      <div className="-mx-4 -mb-4 sm:-mx-5 lg:-mx-6">
        <ResourcePage
          title="Teachers"
          highlight="Resources"
          books={solutionBooks}
          programIds={school.programCodes}
          subjectIds={uniqueSubjectsFromOfferings(school.schoolPrograms)}
          label="Solution Books"
          emptyMessage="Solution books for your subjects in this program will be available here soon."
          compact
        />
      </div>
    </>
  );
}
