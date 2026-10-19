import { SchoolClassesBoard } from "@/features/teachers/school-classes-board";
import { verifySchoolSession } from "@/features/school-auth/session";
import { listSchoolClassTeacherSlots, listSchoolTeachers } from "@/services/teachers";

export default async function SchoolClassesPage() {
  const [school, teachersList, classTeacherSlots] = await Promise.all([
    verifySchoolSession(),
    listSchoolTeachers({ pageSize: 200, status: "ACTIVE" }),
    listSchoolClassTeacherSlots(),
  ]);

  return (
    <SchoolClassesBoard
      schoolPrograms={school.schoolPrograms}
      teachers={teachersList.items}
      classTeacherSlots={classTeacherSlots}
    />
  );
}
