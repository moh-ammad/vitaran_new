import { notFound } from "next/navigation";
import { StudentDetailView } from "@/features/students/student-detail-view";
import { getAdminStudent } from "@/services/students";

type Props = { params: Promise<{ studentId: string }> };

export default async function AdminStudentDetailPage({ params }: Props) {
  const { studentId } = await params;
  const student = await getAdminStudent(studentId);
  if (!student) notFound();

  return (
    <StudentDetailView
      student={student}
      editHref={`/admin/schools/students/${studentId}/edit`}
      afterDeleteHref="/admin/schools/students"
      showCredentials
      adminFlat
    />
  );
}
