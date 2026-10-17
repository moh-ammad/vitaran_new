import { BookOpen, KeyRound, ScanLine, Trophy } from "lucide-react";
import { PageHeader } from "@/features/admin/page-header";
import { StatCard } from "@/features/admin/dashboard-parts";
import { ChipRow, QuickLinks } from "@/features/admin/quick-links";
import { SUBJECT_LABELS } from "@/features/schools/constants";
import { capitalizeWords } from "@/features/schools/schema";
import { verifyTeacherSession } from "@/features/teacher-auth/session";

export default async function TeacherDashboardPage() {
  const teacher = await verifyTeacherSession();

  const subjectIds = [...new Set(teacher.assignments.map((row) => row.subject))];
  const classLevels = [...new Set(teacher.assignments.map((row) => row.classLevel))].sort(
    (a, b) => a - b,
  );

  const links = [
    {
      label: "Resources",
      href: "/teacher/resources",
      icon: BookOpen,
      hint: "Solution books",
    },
    {
      label: "Answer keys",
      href: "/teacher/answer-keys",
      icon: KeyRound,
      hint: "For your classes",
    },
    {
      label: "Results",
      href: "/teacher/results",
      icon: Trophy,
      hint: "For your classes",
    },
    {
      label: "OMR Scan",
      href: "/teacher/omr-scan",
      icon: ScanLine,
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

      <div className="mt-4 md:hidden">
        <QuickLinks items={[...links]} className="grid-cols-2" />
      </div>

      <div className="mt-4 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        {links.map((item) => (
          <StatCard
            key={item.href}
            label={item.label}
            hint={item.hint}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>
    </>
  );
}
