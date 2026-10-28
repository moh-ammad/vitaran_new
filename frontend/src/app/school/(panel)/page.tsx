import Link from "next/link";
import { BookOpen, ChartColumn, KeyRound, School2, Trophy, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/admin/page-header";
import { StatCard } from "@/features/admin/dashboard-parts";
import { SUBJECT_LABELS, programLabel } from "@/features/schools/constants";
import { capitalizeWords } from "@/features/schools/schema";
import { programs } from "@/features/teachers-resources/content";
import { solutionBooks } from "@/features/teachers-resources/solution-books";
import { getSchoolDashboard } from "@/services/teachers";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/school";

function countResources(programCodes: string[], subjectIds: string[]) {
  const subjects = new Set(subjectIds.map((id) => SUBJECT_LABELS[id as keyof typeof SUBJECT_LABELS]));
  return programs
    .filter((program) => programCodes.includes(program.id))
    .reduce((total, program) => {
      const books = solutionBooks[program.title] ?? [];
      return total + books.filter((book) => subjects.has(book.subject)).length;
    }, 0);
}

export default async function SchoolDashboardPage() {
  const stats = await getSchoolDashboard();
  const resources = countResources(
    stats.programLabels.map((row) => row.code),
    stats.subjectIds,
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${capitalizeWords(stats.schoolName)} · ${stats.schoolCode}`}
        actions={
          <Link href="/school/teachers/new" className={cn(buttonVariants())}>
            Add teacher
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Teachers"
          value={stats.teachers.total}
          hint={`${stats.teachers.active} active`}
          icon={Users}
          href="/school/teachers"
        />
        <StatCard
          label="Classes"
          value={stats.classes}
          hint={`${stats.programs} programs`}
          icon={School2}
          href="/school/classes"
        />
        <StatCard
          label="Resources"
          value={resources}
          hint={`${stats.programs} programs · ${stats.subjects} subjects`}
          icon={BookOpen}
          href="/school/resources"
        />
        <StatCard
          label="Answer keys"
          value={stats.answerKeys}
          hint="Published for your school"
          icon={KeyRound}
          href="/school/answer-keys"
        />
        <StatCard
          label="Results"
          value={stats.results}
          hint="Published for your school"
          icon={Trophy}
          href="/school/results"
        />
        <StatCard
          label="Analysis"
          hint="Class, section, and subject performance"
          icon={ChartColumn}
          href="/school/analysis"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-950">Your programs</h2>
          <p className="mt-1 text-xs text-neutral-500">Assigned by Vitaran for this school.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {stats.programLabels.length > 0 ? (
              stats.programLabels.map((program) => (
                <li
                  key={program.code}
                  className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800"
                >
                  {capitalizeWords(programLabel(program.code, program.name))}
                </li>
              ))
            ) : (
              <li className="text-sm text-neutral-500">No programs yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-950">Your subjects</h2>
          <p className="mt-1 text-xs text-neutral-500">Teachers can only be assigned these subjects.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {stats.subjectIds.length > 0 ? (
              stats.subjectIds.map((subject) => (
                <li
                  key={subject}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-800"
                >
                  {SUBJECT_LABELS[subject as Subject] ?? subject}
                </li>
              ))
            ) : (
              <li className="text-sm text-neutral-500">No subjects yet.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
