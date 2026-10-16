import { BookOpen, KeyRound, ScanLine, Trophy } from "lucide-react";
import { PageHeader } from "@/features/admin/page-header";
import { StatCard } from "@/features/admin/dashboard-parts";
import { ChipRow, QuickLinks } from "@/features/admin/quick-links";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import { capitalizeWords } from "@/features/schools/schema";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { programs } from "@/features/teachers-resources/content";
import { solutionBooks } from "@/features/teachers-resources/solution-books";
import { listTeacherAnswerKeys } from "@/services/answer-keys";
import { listTeacherResultSets } from "@/services/results";

function countResources(programCodes: string[], subjectIds: string[]) {
  const subjects = new Set(subjectIds.map((id) => SUBJECT_LABELS[id as keyof typeof SUBJECT_LABELS]));
  return programs
    .filter((program) => programCodes.includes(program.id))
    .reduce((total, program) => {
      const books = solutionBooks[program.title] ?? [];
      return total + books.filter((book) => subjects.has(book.subject)).length;
    }, 0);
}

export default async function TeacherDashboardPage() {
  const [teacher, answerKeys, resultSets] = await Promise.all([
    verifyTeacherSession(),
    listTeacherAnswerKeys(),
    listTeacherResultSets(),
  ]);

  const programCodes = [...new Set(teacher.assignments.map((row) => row.programCode))];
  const subjectIds = [...new Set(teacher.assignments.map((row) => row.subject))];
  const classLevels = [...new Set(teacher.assignments.map((row) => row.classLevel))].sort(
    (a, b) => a - b,
  );
  const resources = countResources(programCodes, subjectIds);

  const links = [
    {
      label: "Resources",
      href: "/teacher/resources",
      icon: BookOpen,
      count: resources,
      hint: "Solution books",
    },
    {
      label: "Answer keys",
      href: "/teacher/answer-keys",
      icon: KeyRound,
      count: answerKeys.length,
      hint: "For your classes",
    },
    {
      label: "Results",
      href: "/teacher/results",
      icon: Trophy,
      count: resultSets.length,
      hint: "For your classes",
    },
    {
      label: "OMR Scan",
      href: "/teacher/omr-scan",
      icon: ScanLine,
      count: classLevels.length,
      hint: "Capture sheets",
    },
  ] as const;

  return (
    <>
      <PageHeader
        title={`Hi, ${capitalizeWords(teacher.name)}`}
        description={`${teacher.school.name} · ${teacher.school.code}`}
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChipRow
            title="Classes"
            items={classLevels.map((level) => `Class ${level}`)}
            empty="No classes assigned yet."
          />
          <ChipRow
            title="Subjects"
            items={subjectIds.map((subject) => SUBJECT_LABELS[subject])}
            empty="No subjects assigned yet."
          />
        </div>
      </section>

      {/* Small cards — mobile only */}
      <div className="mt-4 md:hidden">
        <QuickLinks items={[...links]} className="grid-cols-2" />
      </div>

      {/* Full cards — desktop only */}
      <div className="mt-4 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
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
