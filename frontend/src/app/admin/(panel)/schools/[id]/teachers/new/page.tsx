import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { createAdminTeacherAction } from "@/features/teachers/actions";
import { TeacherForm } from "@/features/teachers/teacher-form";
import { listAdminClassTeacherSlots } from "@/services/teachers";
import { getSchool } from "@/services/schools";

export default async function AdminNewTeacherPage({
  params,
}: PageProps<"/admin/schools/[id]/teachers/new">) {
  const { id } = await params;
  const [school, classTeacherSlots] = await Promise.all([
    getSchool(id),
    listAdminClassTeacherSlots(id),
  ]);
  if (!school) notFound();

  return (
    <>
      <PageHeader
        title="Add teacher"
        description={`${school.name} · assign program classes and subjects`}
      />
      <TeacherForm
        schoolPrograms={school.schoolPrograms}
        classTeacherSlots={classTeacherSlots}
        action={createAdminTeacherAction.bind(null, school.id)}
        cancelHref={`/admin/schools/${school.id}`}
        successHref={`/admin/teachers?schoolId=${school.id}`}
      />
    </>
  );
}
