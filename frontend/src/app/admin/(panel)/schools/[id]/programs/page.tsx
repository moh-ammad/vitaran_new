import { notFound } from "next/navigation";
import { PageHeader } from "@/features/admin/page-header";
import { getSchool } from "@/services/schools";
import { getAdminSchoolStudentCounts } from "@/services/students";
import { capitalizeWords } from "@/features/schools/schema";

type Props = { params: Promise<{ id: string }> };

export default async function AdminSchoolProgramsPage({ params }: Props) {
  const { id } = await params;
  const [school, counts] = await Promise.all([
    getSchool(id),
    getAdminSchoolStudentCounts(id),
  ]);
  if (!school) notFound();
  const countByProgram = counts.byProgram;

  return (
    <>
      <PageHeader
        title="Programs"
        description={`${school.name} · enrolled programs. Students are under Students → school → class.`}
        count={school.schoolPrograms.length}
      />

      {school.schoolPrograms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
          No programs on this school.
        </p>
      ) : (
        <ul className="divide-y divide-brand-50 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)]">
          {school.schoolPrograms.map((program) => (
            <li key={program.programId} className="px-4 py-3.5">
              <p className="truncate text-sm font-semibold text-neutral-950">
                {capitalizeWords(program.programName)}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {program.classes.length} class{program.classes.length === 1 ? "" : "es"} ·{" "}
                {countByProgram[program.programId] ?? 0} students · year {program.year}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
