import { PageHeader } from "@/features/admin/page-header";
import { StudentsTable } from "@/features/students/students-table";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { listTeacherStudents } from "@/services/students";

export default async function TeacherStudentsPage() {
  const [teacher, list] = await Promise.all([
    verifyTeacherSession(),
    listTeacherStudents({ pageSize: 50 }),
  ]);

  const ctLabels = (teacher.classTeacherSections ?? []).map((row) =>
    row.kind === "section"
      ? `Class ${row.classLevel}-${row.sectionName}`
      : `Class ${row.classLevel}`,
  );

  return (
    <>
      <PageHeader
        title="Students"
        description={
          ctLabels.length
            ? `Class teacher of ${ctLabels.join(", ")} · plus assigned classes`
            : "Students in your assigned programs and classes"
        }
        count={list.pagination.total}
      />
      <StudentsTable
        students={list.items}
        mode="teacher"
        emptyMessage="No students in your classes yet."
      />
    </>
  );
}
