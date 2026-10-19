import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/page-header";
import { StudentsTable } from "@/features/students/students-table";
import { cn } from "@/lib/utils";
import { getSchool } from "@/services/schools";
import { listAdminSchoolStudents } from "@/services/students";

type Props = { params: Promise<{ id: string }> };

export default async function AdminSchoolStudentsPage({ params }: Props) {
  const { id } = await params;
  const [school, students] = await Promise.all([
    getSchool(id),
    listAdminSchoolStudents(id, { pageSize: 200 }),
  ]);
  if (!school) notFound();

  return (
    <>
      <PageHeader
        title="Students"
        description={`${school.name} · view, edit, or add students`}
        count={students.pagination.total}
        actions={
          <Link
            href={`/admin/schools/${id}/students/new`}
            className={cn(buttonVariants(), "gap-1.5")}
          >
            <Plus className="size-4" />
            Add student
          </Link>
        }
      />

      <StudentsTable
        students={students.items}
        mode="admin"
        emptyMessage="No students yet. Click Add student."
      />
    </>
  );
}
