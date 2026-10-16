import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { updateAdminTeacherAction } from "@/features/teachers/actions";
import { TeacherForm } from "@/features/teachers/teacher-form";
import { getAdminTeacher, listAdminClassTeacherSlots } from "@/services/teachers";
import { getSchool } from "@/services/schools";

export default async function AdminEditTeacherPage({
  params,
}: PageProps<"/admin/teachers/[id]/edit">) {
  const { id } = await params;
  const teacher = await getAdminTeacher(id);
  if (!teacher) notFound();
  const [school, classTeacherSlots] = await Promise.all([
    getSchool(teacher.schoolId),
    listAdminClassTeacherSlots(teacher.schoolId),
  ]);
  if (!school) notFound();

  const myClassTeacherSlots = classTeacherSlots
    .filter((slot) => slot.teacherId === teacher.id)
    .map((slot) => ({ programId: slot.programId, classLevel: slot.classLevel }));

  return (
    <>
      <PageHeader
        title="Edit teacher"
        description={`${teacher.name} · ${school.name}`}
      />
      <TeacherForm
        teacher={teacher}
        schoolPrograms={school.schoolPrograms}
        classTeacherSlots={classTeacherSlots}
        myClassTeacherSlots={myClassTeacherSlots}
        action={updateAdminTeacherAction.bind(null, teacher.id)}
        cancelHref="/admin/teachers"
        successHref="/admin/teachers"
      />
    </>
  );
}
