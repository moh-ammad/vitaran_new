import { PageHeader } from "@/features/admin/page-header";
import { verifySchoolSession } from "@/features/school-auth/session";
import { createSchoolTeacherAction } from "@/features/teachers/actions";
import { TeacherForm } from "@/features/teachers/teacher-form";
import { listSchoolClassTeacherSlots } from "@/services/teachers";

export default async function NewSchoolTeacherPage() {
  const [school, classTeacherSlots] = await Promise.all([
    verifySchoolSession(),
    listSchoolClassTeacherSlots(),
  ]);

  return (
    <>
      <PageHeader title="Add teacher" description="Assign at least one class and subject." />
      <TeacherForm
        schoolPrograms={school.schoolPrograms}
        classTeacherSlots={classTeacherSlots}
        action={createSchoolTeacherAction}
        cancelHref="/school/teachers"
        successHref="/school/teachers"
      />
    </>
  );
}
