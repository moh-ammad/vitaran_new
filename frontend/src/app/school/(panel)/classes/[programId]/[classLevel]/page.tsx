import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { verifySchoolSession } from "@/features/school-auth/session";
import { capitalizeWords } from "@/features/schools/schema";
import { ClassDetailForm } from "@/features/teachers/class-detail-form";
import { listSchoolClasses, listSchoolTeachers } from "@/services/teachers";

export default async function SchoolClassDetailPage({
  params,
}: {
  params: Promise<{ programId: string; classLevel: string }>;
}) {
  const { programId, classLevel: classLevelRaw } = await params;
  const classLevel = Number(classLevelRaw);
  if (!Number.isInteger(classLevel)) notFound();

  await verifySchoolSession();
  const [classes, { items: teachers }] = await Promise.all([
    listSchoolClasses(),
    listSchoolTeachers({ pageSize: 200 }),
  ]);

  const row = classes.find((item) => item.programId === programId && item.classLevel === classLevel);
  if (!row) notFound();

  // Only active teachers who teach at least one subject in this program + class.
  const classTeachers = (teachers ?? []).filter(
    (teacher) =>
      teacher.status === "ACTIVE" &&
      (teacher.assignments ?? []).some(
        (assignment) =>
          assignment.programId === programId && assignment.classLevel === classLevel,
      ),
  );

  return (
    <>
      <PageHeader
        title={`Class ${row.classLevel}`}
        description={capitalizeWords(row.programName)}
      />
      <ClassDetailForm
        programId={row.programId}
        programName={row.programName}
        classLevel={row.classLevel}
        currentTeacherId={row.classTeacher?.teacherId ?? null}
        teachers={classTeachers}
      />
    </>
  );
}
