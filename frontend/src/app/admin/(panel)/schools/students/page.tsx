import { PageHeader } from "@/features/admin/page-header";
import { StudentsTable } from "@/features/students/students-table";
import { listSchools } from "@/services/schools";
import { listAdminSchoolStudents } from "@/services/students";

type Props = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function AdminAllStudentsPage({ searchParams }: Props) {
  const { schoolId } = await searchParams;
  const schools = await listSchools({ pageSize: 100 });
  const schoolMap = new Map(schools.items.map((s) => [s.id, s]));

  const targets = schoolId
    ? schools.items.filter((s) => s.id === schoolId)
    : schools.items;

  const batches = await Promise.all(
    targets.map(async (school) => {
      const list = await listAdminSchoolStudents(school.id, { pageSize: 200 });
      return list.items.map((student) => ({
        ...student,
        schoolName: school.name,
      }));
    }),
  );

  const students = batches.flat().sort((a, b) => {
    const schoolCmp = (a.schoolName ?? "").localeCompare(b.schoolName ?? "");
    if (schoolCmp !== 0) return schoolCmp;
    return a.classLevel - b.classLevel || a.rollNo.localeCompare(b.rollNo);
  });

  const filterSchool = schoolId ? schoolMap.get(schoolId) : null;

  return (
    <>
      <PageHeader
        title="Students"
        description={
          filterSchool
            ? `${filterSchool.name} · open a row to view or edit`
            : "All students across schools. Open a school for a focused roster, or pick a student here."
        }
        count={students.length}
      />

      <StudentsTable
        students={students}
        mode="admin"
        showSchool={!filterSchool}
        emptyMessage="No students yet. Schools add them from their portal, or open a school and use Add student."
      />
    </>
  );
}
