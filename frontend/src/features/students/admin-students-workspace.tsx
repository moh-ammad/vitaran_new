"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegisterInPageBack } from "@/components/layout/in-page-back";
import { PageHeader } from "@/features/admin/page-header";
import { StudentDetailView } from "@/features/students/student-detail-view";
import { StudentForm } from "@/features/students/student-form";
import { StudentsTable } from "@/features/students/students-table";
import {
  createAdminStudentAction,
  loadAdminRosterAction,
  loadAdminSchoolPackAction,
  loadAdminStudentAction,
  updateAdminStudentAction,
} from "@/features/students/admin-student-actions";
import type { StudentFormAction } from "@/features/students/student-form";
import { capitalizeWords } from "@/features/schools/schema";
import { cn } from "@/lib/utils";
import type { SchoolDetail, SchoolSummary } from "@/types/school";
import type { ClassOrganization, SchoolSection, WholeClass } from "@/types/section";
import type { ClassTeacherSlot } from "@/types/teacher";
import type { Student, StudentDetail } from "@/types/student";

type SchoolStudentCounts = {
  byProgram: Record<string, number>;
  byClass: { programId: string; classLevel: number; count: number }[];
  bySection: Record<string, number>;
  byWhole: { programId: string; classLevel: number; count: number }[];
};

type Pack = {
  school: SchoolDetail;
  organization: ClassOrganization;
  slots: ClassTeacherSlot[];
  counts: SchoolStudentCounts;
};

type RosterFocus =
  | { kind: "section"; row: SchoolSection }
  | { kind: "whole"; row: WholeClass };

type View =
  | { name: "schools" }
  | { name: "classes"; pack: Pack }
  | { name: "programs"; pack: Pack; classLevel: number }
  | { name: "sections"; pack: Pack; classLevel: number; programId: string }
  | { name: "roster"; pack: Pack; classLevel: number; programId: string; focus: RosterFocus }
  | {
      name: "student";
      pack: Pack;
      classLevel: number;
      programId: string;
      focus: RosterFocus;
      student: StudentDetail;
    }
  | {
      name: "form";
      pack: Pack;
      classLevel: number;
      programId: string;
      focus: RosterFocus;
      student?: StudentDetail | null;
    };

function uniqueNames(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function teacherLabel(names: Array<string | null | undefined>) {
  const labeled = uniqueNames(names);
  if (labeled.length === 0) return "—";
  if (labeled.length === 1) return capitalizeWords(labeled[0]);
  return "Multiple class teachers";
}

function classTeacherForWhole(pack: Pack, programId: string, classLevel: number) {
  return (
    pack.slots.find(
      (slot) => slot.kind === "class" && slot.programId === programId && slot.classLevel === classLevel,
    )?.teacherName ?? null
  );
}

function DrillCard({
  title,
  meta,
  teacher,
  onClick,
}: {
  title: string;
  meta: string;
  teacher?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-brand-200 bg-white px-4 py-3.5 text-left shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)] transition-colors hover:border-brand-400 hover:bg-brand-50/40"
    >
      <p className="truncate text-sm font-semibold text-neutral-950">{title}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{meta}</p>
      {teacher !== undefined ? (
        <p className="mt-2 text-xs text-neutral-600">
          Class teacher{" "}
          <span className="font-medium text-neutral-900">{teacher && teacher !== "—" ? teacher : "—"}</span>
        </p>
      ) : null}
    </button>
  );
}

type AdminStudentsWorkspaceProps = {
  schools: SchoolSummary[];
  initialSchoolId?: string;
};

export function AdminStudentsWorkspace({ schools, initialSchoolId }: AdminStudentsWorkspaceProps) {
  const [view, setView] = useState<View>({ name: "schools" });
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const openSchool = useCallback((schoolId: string) => {
    startTransition(async () => {
      const pack = await loadAdminSchoolPackAction(schoolId);
      if (!pack) {
        toast.error("Could not load that school");
        return;
      }
      setView({ name: "classes", pack });
    });
  }, []);

  useEffect(() => {
    if (!initialSchoolId) return;
    openSchool(initialSchoolId);
  }, [initialSchoolId, openSchool]);

  const loadRoster = useCallback((schoolId: string, focus: RosterFocus) => {
    startTransition(async () => {
      const items = await loadAdminRosterAction(
        schoolId,
        focus.kind === "section"
          ? { sectionId: focus.row.id }
          : { programId: focus.row.programId, classLevel: focus.row.classLevel, wholeClass: true },
      );
      setStudents(items);
    });
  }, []);

  const goBack = useCallback(() => {
    if (view.name === "form") {
      setView(
        view.student
          ? {
              name: "student",
              pack: view.pack,
              classLevel: view.classLevel,
              programId: view.programId,
              focus: view.focus,
              student: view.student,
            }
          : {
              name: "roster",
              pack: view.pack,
              classLevel: view.classLevel,
              programId: view.programId,
              focus: view.focus,
            },
      );
      return;
    }
    if (view.name === "student") {
      setView({
        name: "roster",
        pack: view.pack,
        classLevel: view.classLevel,
        programId: view.programId,
        focus: view.focus,
      });
      loadRoster(view.pack.school.id, view.focus);
      return;
    }
    if (view.name === "roster") {
      const sections = view.pack.organization.sections.filter(
        (row) => row.classLevel === view.classLevel && row.programId === view.programId,
      );
      const whole = view.pack.organization.wholeClasses.find(
        (row) => row.classLevel === view.classLevel && row.programId === view.programId,
      );
      if (sections.length > 0) {
        setView({
          name: "sections",
          pack: view.pack,
          classLevel: view.classLevel,
          programId: view.programId,
        });
        return;
      }
      if (whole) {
        setView({ name: "programs", pack: view.pack, classLevel: view.classLevel });
        return;
      }
      setView({ name: "programs", pack: view.pack, classLevel: view.classLevel });
      return;
    }
    if (view.name === "sections") {
      setView({ name: "programs", pack: view.pack, classLevel: view.classLevel });
      return;
    }
    if (view.name === "programs") {
      setView({ name: "classes", pack: view.pack });
      return;
    }
    if (view.name === "classes") {
      setView({ name: "schools" });
    }
  }, [view, loadRoster]);

  useRegisterInPageBack(view.name === "schools" ? null : goBack);

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(q) ||
        school.code.toLowerCase().includes(q) ||
        school.city.toLowerCase().includes(q),
    );
  }, [schools, query]);

  const openRoster = (pack: Pack, classLevel: number, programId: string, focus: RosterFocus) => {
    setView({ name: "roster", pack, classLevel, programId, focus });
    loadRoster(pack.school.id, focus);
  };

  const openProgram = (pack: Pack, classLevel: number, programId: string) => {
    const sections = pack.organization.sections.filter(
      (row) => row.classLevel === classLevel && row.programId === programId,
    );
    const whole = pack.organization.wholeClasses.find(
      (row) => row.classLevel === classLevel && row.programId === programId,
    );
    if (sections.length > 0) {
      setView({ name: "sections", pack, classLevel, programId });
      return;
    }
    if (whole) {
      openRoster(pack, classLevel, programId, { kind: "whole", row: whole });
      return;
    }
    toast.error("No class or section for that program yet");
  };

  const openStudent = (studentId: string, next: Extract<View, { name: "roster" | "student" | "form" }>) => {
    startTransition(async () => {
      const detail = await loadAdminStudentAction(studentId);
      if (!detail) return;
      setView({
        name: "student",
        pack: next.pack,
        classLevel: next.classLevel,
        programId: next.programId,
        focus: next.focus,
        student: detail,
      });
    });
  };

  if (view.name === "form") {
    const focus = view.focus;
    const title = view.student ? "Edit student" : "Add student";
    const defaults =
      focus.kind === "section"
        ? {
            programId: focus.row.programId,
            classLevel: focus.row.classLevel,
            sectionId: focus.row.id,
          }
        : {
            programId: focus.row.programId,
            classLevel: focus.row.classLevel,
            sectionId: null as string | null,
          };

    return (
      <div className="space-y-3">
        <PageHeader
          title={title}
          description={`${view.pack.school.name} · ${
            focus.kind === "section"
              ? `Class ${focus.row.classLevel}-${focus.row.name}`
              : `Class ${focus.row.classLevel}`
          } · ${capitalizeWords(focus.row.programName)}`}
        />
        <div className="w-full max-w-lg rounded-2xl border border-brand-200 bg-white p-4 shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)] sm:p-5">
          <StudentForm
            schoolPrograms={view.pack.school.schoolPrograms}
            sections={view.pack.organization.sections}
            student={view.student}
            defaults={defaults}
            lockPlacement
            returnTo="/admin/schools/students"
            stayInPlace
            formActionOverride={
              (view.student
                ? updateAdminStudentAction.bind(null, view.student.id)
                : createAdminStudentAction.bind(null, view.pack.school.id)) as StudentFormAction
            }
            onSuccess={(studentId) => {
              loadRoster(view.pack.school.id, focus);
              openStudent(studentId, view);
            }}
          />
        </div>
      </div>
    );
  }

  if (view.name === "student") {
    return (
      <div className="space-y-3">
        {pending ? (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : null}
        <StudentDetailView
          student={view.student}
          adminFlat
          onEdit={() =>
            setView({
              name: "form",
              pack: view.pack,
              classLevel: view.classLevel,
              programId: view.programId,
              focus: view.focus,
              student: view.student,
            })
          }
          onDeleted={() => {
            loadRoster(view.pack.school.id, view.focus);
            setView({
              name: "roster",
              pack: view.pack,
              classLevel: view.classLevel,
              programId: view.programId,
              focus: view.focus,
            });
          }}
        />
      </div>
    );
  }

  if (view.name === "roster") {
    const focus = view.focus;
    const seats = focus.row.studentCount;
    const enrolled = students.length;
    const full = enrolled >= seats;
    const title =
      focus.kind === "section"
        ? `Class ${focus.row.classLevel}-${focus.row.name}`
        : `Class ${focus.row.classLevel}`;
    const teacher =
      focus.kind === "section"
        ? focus.row.classTeacher?.name
        : classTeacherForWhole(view.pack, focus.row.programId, focus.row.classLevel);

    return (
      <div className="space-y-3">
        <PageHeader
          title={title}
          description={`${view.pack.school.name} · ${capitalizeWords(focus.row.programName)} · ${enrolled}/${seats} seats · Class teacher ${teacher ? capitalizeWords(teacher) : "—"}`}
          count={enrolled}
          actions={
            full ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                Full ({seats} seats).
              </p>
            ) : (
              <Button
                type="button"
                className="gap-1.5"
                onClick={() =>
                  setView({
                    name: "form",
                    pack: view.pack,
                    classLevel: view.classLevel,
                    programId: view.programId,
                    focus,
                    student: null,
                  })
                }
              >
                <Plus className="size-4" />
                Add student
              </Button>
            )
          }
        />
        <StudentsTable
          students={students}
          mode="admin"
          emptyMessage="No students in this class yet."
          onView={(id) => openStudent(id, view)}
          onEdit={(id) => {
            startTransition(async () => {
              const detail = await loadAdminStudentAction(id);
              if (!detail) return;
              setView({
                name: "form",
                pack: view.pack,
                classLevel: view.classLevel,
                programId: view.programId,
                focus,
                student: detail,
              });
            });
          }}
          onDeleted={() => loadRoster(view.pack.school.id, focus)}
        />
      </div>
    );
  }

  if (view.name === "sections") {
    const { pack, classLevel, programId } = view;
    const sections = pack.organization.sections
      .filter((row) => row.classLevel === classLevel && row.programId === programId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    const whole = pack.organization.wholeClasses.find(
      (row) => row.classLevel === classLevel && row.programId === programId,
    );
    const programName =
      sections[0]?.programName ?? whole?.programName ?? pack.school.schoolPrograms.find((row) => row.programId === programId)?.programName ?? "Program";

    return (
      <div className="space-y-3">
        <PageHeader
          title={`Class ${classLevel} sections`}
          description={`${pack.school.name} · ${capitalizeWords(programName)}`}
          count={sections.length + (whole ? 1 : 0)}
        />
        <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-70")}>
          {whole ? (
            <DrillCard
              title="Whole class"
              meta={`No section · ${pack.counts.byWhole.find((row) => row.programId === programId && row.classLevel === classLevel)?.count ?? 0}/${whole.studentCount} seats`}
              teacher={teacherLabel([classTeacherForWhole(pack, programId, classLevel)])}
              onClick={() => openRoster(pack, classLevel, programId, { kind: "whole", row: whole })}
            />
          ) : null}
          {sections.map((section) => (
            <DrillCard
              key={section.id}
              title={`Section ${section.name}`}
              meta={`${pack.counts.bySection[section.id] ?? 0}/${section.studentCount} seats`}
              teacher={teacherLabel([section.classTeacher?.name])}
              onClick={() => openRoster(pack, classLevel, programId, { kind: "section", row: section })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (view.name === "programs") {
    const { pack, classLevel } = view;
    const programs = new Map<string, { name: string; seats: number; enrolled: number; teachers: string[] }>();
    for (const row of pack.organization.wholeClasses.filter((item) => item.classLevel === classLevel)) {
      const enrolled =
        pack.counts.byWhole.find((item) => item.programId === row.programId && item.classLevel === classLevel)
          ?.count ?? 0;
      programs.set(row.programId, {
        name: row.programName,
        seats: row.studentCount,
        enrolled,
        teachers: uniqueNames([classTeacherForWhole(pack, row.programId, classLevel)]),
      });
    }
    for (const row of pack.organization.sections.filter((item) => item.classLevel === classLevel)) {
      const current = programs.get(row.programId);
      const enrolled = pack.counts.bySection[row.id] ?? 0;
      if (current) {
        current.seats += row.studentCount;
        current.enrolled += enrolled;
        current.teachers = uniqueNames([...current.teachers, row.classTeacher?.name]);
      } else {
        programs.set(row.programId, {
          name: row.programName,
          seats: row.studentCount,
          enrolled,
          teachers: uniqueNames([row.classTeacher?.name]),
        });
      }
    }

    return (
      <div className="space-y-3">
        <PageHeader
          title={`Class ${classLevel} programs`}
          description={pack.school.name}
          count={programs.size}
        />
        {programs.size === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
            No programs set up for this class yet.
          </p>
        ) : (
          <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-70")}>
            {[...programs.entries()]
              .sort((a, b) => a[1].name.localeCompare(b[1].name))
              .map(([programId, row]) => (
                <DrillCard
                  key={programId}
                  title={capitalizeWords(row.name)}
                  meta={`${row.enrolled}/${row.seats} seats`}
                  teacher={teacherLabel(row.teachers)}
                  onClick={() => openProgram(pack, classLevel, programId)}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  if (view.name === "classes") {
    const { pack } = view;
    const levels = new Set<number>();
    for (const row of pack.organization.wholeClasses) levels.add(row.classLevel);
    for (const row of pack.organization.sections) levels.add(row.classLevel);
    const classLevels = [...levels].sort((a, b) => a - b);

    return (
      <div className="space-y-3">
        <PageHeader
          title={pack.school.name}
          description={`${pack.school.code} · pick a class, then program and section`}
          count={classLevels.length}
        />
        {classLevels.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
            This school has no classes yet. The school portal creates classes and sections.
          </p>
        ) : (
          <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-70")}>
            {classLevels.map((classLevel) => {
              const teachers = uniqueNames([
                ...pack.slots
                  .filter((slot) => slot.classLevel === classLevel)
                  .map((slot) => slot.teacherName),
                ...pack.organization.sections
                  .filter((row) => row.classLevel === classLevel)
                  .map((row) => row.classTeacher?.name),
              ]);
              const enrolled = pack.counts.byClass
                .filter((row) => row.classLevel === classLevel)
                .reduce((sum, row) => sum + row.count, 0);
              const programCount = new Set([
                ...pack.organization.wholeClasses
                  .filter((row) => row.classLevel === classLevel)
                  .map((row) => row.programId),
                ...pack.organization.sections
                  .filter((row) => row.classLevel === classLevel)
                  .map((row) => row.programId),
              ]).size;
              return (
                <DrillCard
                  key={classLevel}
                  title={`Class ${classLevel}`}
                  meta={`${programCount} program${programCount === 1 ? "" : "s"} · ${enrolled} students`}
                  teacher={teacherLabel(teachers)}
                  onClick={() => setView({ name: "programs", pack, classLevel })}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Students"
        description="Open a school, then class → program → section to see that roster."
        count={schools.length}
      />
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search school name or code"
          className="h-10 pl-9"
        />
      </div>
      {pending ? (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="size-4 animate-spin" />
          Loading school…
        </div>
      ) : null}
      {filteredSchools.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
          {schools.length === 0 ? "No schools yet." : "No matching schools."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => (
            <DrillCard
              key={school.id}
              title={school.name}
              meta={`${school.code} · ${school.city}, ${school.state}`}
              onClick={() => openSchool(school.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
