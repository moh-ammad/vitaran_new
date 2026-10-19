import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { createAdminStudentAction } from "@/features/students/admin-student-actions";
import { StudentForm } from "@/features/students/student-form";
import { listAdminSchoolSections } from "@/services/sections";
import { getSchool } from "@/services/schools";

type Props = { params: Promise<{ id: string }> };

export default async function AdminSchoolStudentNewPage({ params }: Props) {
  const { id } = await params;
  const [school, organization] = await Promise.all([
    getSchool(id),
    listAdminSchoolSections(id),
  ]);
  if (!school) notFound();

  const formAction = createAdminStudentAction.bind(null, id);

  return (
    <>
      <PageHeader title="Add student" description={school.name} />
      <div className="mt-3 w-full max-w-lg rounded-2xl border border-brand-200 bg-white p-4 shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)] sm:p-5">
        <StudentForm
          schoolPrograms={school.schoolPrograms}
          sections={organization.sections}
          returnTo="/admin/schools/students"
          formActionOverride={formAction}
        />
      </div>
    </>
  );
}
