import { SchoolClassesWorkspace } from "@/features/students/school-classes-workspace";
import { verifySchoolSession } from "@/features/school-auth/session";
import { listSchoolClassOrganization } from "@/services/sections";
import { listSchoolStudents } from "@/services/students";
import { listSchoolClassTeacherSlots, listSchoolTeachers } from "@/services/teachers";

export default async function SchoolClassesPage() {
  const [school, teachersList, classTeacherSlots, organization, students] = await Promise.all([
    verifySchoolSession(),
    listSchoolTeachers({ pageSize: 200, status: "ACTIVE" }),
    listSchoolClassTeacherSlots(),
    listSchoolClassOrganization(),
    listSchoolStudents({ pageSize: 200 }),
  ]);

  const enrolledBySection = new Map<string, number>();
  const enrolledByWhole = new Map<string, number>();

  for (const student of students.items) {
    if (student.sectionId) {
      enrolledBySection.set(
        student.sectionId,
        (enrolledBySection.get(student.sectionId) ?? 0) + 1,
      );
      continue;
    }
    const whole = organization.wholeClasses.find(
      (row) =>
        row.classLevel === student.classLevel && row.programId === student.programId,
    );
    if (whole) {
      enrolledByWhole.set(whole.id, (enrolledByWhole.get(whole.id) ?? 0) + 1);
    }
  }

  return (
    <SchoolClassesWorkspace
      schoolPrograms={school.schoolPrograms}
      teachers={teachersList.items}
      classTeacherSlots={classTeacherSlots}
      students={students.items}
      sections={organization.sections}
      enrolledBySection={Object.fromEntries(enrolledBySection)}
      enrolledByWhole={Object.fromEntries(enrolledByWhole)}
    />
  );
}
