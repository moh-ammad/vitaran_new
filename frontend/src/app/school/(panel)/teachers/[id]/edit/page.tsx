import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { verifySchoolSession } from "@/features/school-auth/session";
import { updateSchoolTeacherAction } from "@/features/teachers/actions";
import { TeacherForm } from "@/features/teachers/teacher-form";
import { getSchoolTeacher, listSchoolClassTeacherSlots } from "@/services/teachers";

export default async function EditSchoolTeacherPage({
  params,
}: PageProps<"/school/teachers/[id]/edit">) {
  const { id } = await params;
  const [school, teacher, classTeacherSlots] = await Promise.all([
    verifySchoolSession(),
    getSchoolTeacher(id),
    listSchoolClassTeacherSlots(),
  ]);
  if (!teacher) notFound();

  const myClassTeacherSlots = classTeacherSlots
    .filter((slot) => slot.teacherId === teacher.id)
    .map((slot) => ({ programId: slot.programId, classLevel: slot.classLevel }));

  return (
    <>
      <PageHeader title="Edit teacher" description={teacher.email} />
      <TeacherForm
        teacher={teacher}
        schoolPrograms={school.schoolPrograms}
        classTeacherSlots={classTeacherSlots}
        myClassTeacherSlots={myClassTeacherSlots}
        action={updateSchoolTeacherAction.bind(null, teacher.id)}
        cancelHref="/school/teachers"
        successHref="/school/teachers"
      />
    </>
  );
}
