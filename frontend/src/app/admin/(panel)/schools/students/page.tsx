import { AdminStudentsWorkspace } from "@/features/students/admin-students-workspace";
import { listSchools } from "@/services/schools";

type Props = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function AdminAllStudentsPage({ searchParams }: Props) {
  const { schoolId } = await searchParams;
  const { items } = await listSchools({ pageSize: 100 });

  return <AdminStudentsWorkspace schools={items} initialSchoolId={schoolId} />;
}
