import { PageHeader } from "@/features/admin/page-header";
import { setAdminTeacherStatusAction } from "@/features/teachers/actions";
import { TeachersTable } from "@/features/teachers/teachers-table";
import { listAdminTeachers } from "@/services/teachers";

export default async function AdminTeachersPage({
  searchParams,
}: PageProps<"/admin/teachers">) {
  const query = await searchParams;
  const schoolId = typeof query.schoolId === "string" ? query.schoolId : undefined;
  const { items, pagination } = await listAdminTeachers({
    schoolId,
    pageSize: 50,
  });

  return (
    <>
      <PageHeader
        title="Teachers"
        count={pagination.total}
        description="All teachers across schools. Toggle access or open a school to manage them."
      />
      <TeachersTable
        teachers={items}
        showSchool
        editHrefBase="/admin/teachers"
        onToggleStatus={setAdminTeacherStatusAction}
      />
    </>
  );
}
