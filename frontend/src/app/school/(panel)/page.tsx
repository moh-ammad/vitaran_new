import { BookOpen, KeyRound, School2, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/features/admin/page-header";
import { StatCard } from "@/features/admin/dashboard-parts";
import { ChipRow, QuickLinks } from "@/features/admin/quick-links";
import { SUBJECT_LABELS, programLabel } from "@/features/schools/constants";
import { uniqueSubjectsFromOfferings } from "@/features/schools/offerings";
import { capitalizeWords } from "@/features/schools/schema";
import { verifySchoolSession } from "@/features/school-auth/session";
import { programs } from "@/features/teachers-resources/content";
import { solutionBooks } from "@/features/teachers-resources/solution-books";
import { getSchoolDashboard } from "@/services/teachers";

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
  const [school, stats] = await Promise.all([verifySchoolSession(), getSchoolDashboard()]);
  const subjects = uniqueSubjectsFromOfferings(school.schoolPrograms);
  const resources = countResources(school.programCodes, subjects);
  const classCount = school.schoolPrograms.reduce((total, row) => total + row.classes.length, 0);

  const links = [
    {
      label: "Teachers",
      href: "/school/teachers",
      icon: Users,
      count: stats.teachers.total,
      hint: `${stats.teachers.active} active`,
    },
    {
      label: "Classes",
      href: "/school/classes",
      icon: School2,
      count: classCount,
      hint: `${stats.programs} programs`,
    },
    {
      label: "Resources",
      href: "/school/resources",
      icon: BookOpen,
      count: resources,
      hint: "Solution books",
    },
    {
      label: "Answer keys",
      href: "/school/answer-keys",
      icon: KeyRound,
      count: stats.answerKeys,
      hint: "Published",
    },
    {
      label: "Results",
      href: "/school/results",
      icon: Trophy,
      count: stats.results,
      hint: "Published",
    },
  ] as const;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${capitalizeWords(school.name)} · ${school.code}`}
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChipRow
            title="Programs"
            items={school.schoolPrograms.map((row) =>
              capitalizeWords(programLabel(row.programCode, row.programName)),
            )}
            empty="No programs yet."
          />
          <ChipRow
            title="Subjects"
            items={subjects.map((subject) => SUBJECT_LABELS[subject])}
            empty="No subjects yet."
          />
        </div>
      </section>

      {/* Small cards — mobile only */}
      <div className="mt-4 md:hidden">
        <QuickLinks items={[...links]} className="grid-cols-2" />
      </div>

      {/* Full cards — desktop only */}
      <div className="mt-4 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {links.map((item) => (
          <StatCard
            key={item.href}
            label={item.label}
            value={item.count}
            hint={item.hint}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>
    </>
  );
}
