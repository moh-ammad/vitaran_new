import { PageHeader } from "@/features/admin/page-header";
import { StudentsTable } from "@/features/students/students-table";
import { listAdminStudents } from "@/services/students";

type Props = {
  searchParams: Promise<{ schoolId?: string }>;
};

export default async function AdminAllStudentsPage({ searchParams }: Props) {
  const { schoolId } = await searchParams;
  const { items, pagination } = await listAdminStudents({ schoolId, pageSize: 100 });
  const filterSchoolName = schoolId ? items[0]?.schoolName : null;
  const truncated = pagination.total > items.length;

  return (
    <>
      <PageHeader
        title="Students"
        description={
          filterSchoolName
            ? `${filterSchoolName} · open a row to view or edit`
            : "All students across schools. Open a school for a focused roster, or pick a student here."
        }
        count={pagination.total}
      />

      {truncated ? (
        <p className="mb-3 text-xs text-neutral-500">
          Showing the first {items.length} of {pagination.total}. Open a school to see its full roster.
        </p>
      ) : null}

      <StudentsTable
        students={items}
        mode="admin"
        showSchool={!schoolId}
        emptyMessage="No students yet. Schools add them from their portal, or open a school and use Add student."
      />
    </>
  );
}
