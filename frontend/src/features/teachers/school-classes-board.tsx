"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/features/admin/page-header";
import {
  createSectionAction,
  deleteSectionAction,
  deleteWholeClassAction,
  loadSchoolSectionsAction,
  updateSectionAction,
  updateWholeClassAction,
} from "@/features/schools/section-actions";
import { capitalizeWords } from "@/features/schools/schema";
import { setClassTeacherAction } from "@/features/teachers/actions";
import { cn } from "@/lib/utils";
import type { SchoolProgramOffering } from "@/types/program";
import type {
  ClassOrganization,
  SchoolSection,
  SectionStrength,
  WholeClass,
} from "@/types/section";
import type { ClassTeacherSlot, Teacher } from "@/types/teacher";

type SchoolClassesBoardProps = {
  schoolPrograms: SchoolProgramOffering[];
  teachers: Teacher[];
  classTeacherSlots: ClassTeacherSlot[];
};

const NONE = "__none__";

const cardShell =
  "overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)]";

const iconBtn =
  "flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-500 disabled:pointer-events-none disabled:opacity-40";

type EditTarget =
  | { kind: "section"; row: SchoolSection }
  | { kind: "class"; row: WholeClass };

function groupSections(sections: SchoolSection[]) {
  const map = new Map<number, SchoolSection[]>();
  for (const section of sections) {
    const list = map.get(section.classLevel) ?? [];
    list.push(section);
    map.set(section.classLevel, list);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function teachersForSlot(
  teachers: Teacher[],
  programId: string,
  classLevel: number,
) {
  return teachers
    .filter(
      (teacher) =>
        teacher.status === "ACTIVE" &&
        teacher.assignments.some(
          (row) => row.programId === programId && row.classLevel === classLevel,
        ),
    )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function SchoolClassesBoard({
  schoolPrograms,
  teachers,
  classTeacherSlots: initialSlots,
}: SchoolClassesBoardProps) {
  const [organization, setOrganization] = useState<ClassOrganization | null>(null);
  const [strength, setStrength] = useState<SectionStrength | null>(null);
  const [slots, setSlots] = useState(initialSlots);
  const [pending, startTransition] = useTransition();

  const [classLevel, setClassLevel] = useState("");
  const [name, setName] = useState("");
  const [programId, setProgramId] = useState("");
  const [studentCount, setStudentCount] = useState("30");

  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editName, setEditName] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editSeats, setEditSeats] = useState("");
  const [editTeacherId, setEditTeacherId] = useState(NONE);

  const reload = useCallback(() => {
    startTransition(async () => {
      const data = await loadSchoolSectionsAction();
      setOrganization(data.organization);
      setStrength(data.strength);
      setSlots(data.classTeacherSlots);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const classCtByKey = useMemo(() => {
    const map = new Map<string, ClassTeacherSlot>();
    for (const slot of slots) {
      if (slot.kind === "class") {
        map.set(`${slot.programId}:${slot.classLevel}`, slot);
      }
    }
    return map;
  }, [slots]);

  const classOptions = useMemo(() => {
    const levels = new Set<number>();
    for (const program of schoolPrograms) {
      for (const cls of program.classes) levels.add(cls.classLevel);
    }
    return [...levels].sort((a, b) => a - b);
  }, [schoolPrograms]);

  const programsForClass = useMemo(() => {
    const level = Number(classLevel);
    if (!level) return [];
    return schoolPrograms.filter((row) =>
      row.classes.some((cls) => cls.classLevel === level),
    );
  }, [schoolPrograms, classLevel]);

  const programsForEdit = useMemo(() => {
    if (!editing) return [];
    const level = editing.row.classLevel;
    return schoolPrograms.filter((row) =>
      row.classes.some((cls) => cls.classLevel === level),
    );
  }, [schoolPrograms, editing]);

  const eligibleTeachers = useMemo(() => {
    if (!editing || !editProgramId) return [];
    const list = teachersForSlot(teachers, editProgramId, editing.row.classLevel);
    if (editTeacherId !== NONE && !list.some((row) => row.id === editTeacherId)) {
      const current = teachers.find((row) => row.id === editTeacherId);
      if (current) return [current, ...list];
    }
    return list;
  }, [editing, editProgramId, teachers, editTeacherId]);

  useEffect(() => {
    if (!programId) return;
    if (!programsForClass.some((row) => row.programId === programId)) {
      setProgramId("");
    }
  }, [programsForClass, programId]);

  const openEdit = (target: EditTarget) => {
    setEditing(target);
    setEditName(target.kind === "section" ? target.row.name : "");
    setEditProgramId(target.row.programId);
    setEditSeats(String(target.row.studentCount));

    if (target.kind === "section") {
      setEditTeacherId(target.row.classTeacher?.teacherId ?? NONE);
    } else {
      const slot = classCtByKey.get(`${target.row.programId}:${target.row.classLevel}`);
      setEditTeacherId(slot?.teacherId ?? NONE);
    }
  };

  const create = () => {
    const level = Number(classLevel);
    const count = Number(studentCount);
    const sectionName = name.trim();
    if (!classOptions.includes(level)) {
      toast.error("That class is not enabled by admin for this school.");
      return;
    }
    if (!level || !programId || !count) {
      toast.error("Fill class, program, and seats. Section is optional.");
      return;
    }
    if (!programsForClass.some((row) => row.programId === programId)) {
      toast.error("That program is not enabled for the selected class.");
      return;
    }
    startTransition(async () => {
      const result = await createSectionAction({
        classLevel: level,
        name: sectionName || null,
        programId,
        studentCount: count,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (result.result.kind === "class") {
        toast.success(`Class ${result.result.class.classLevel} created (no section)`);
      } else {
        toast.success(
          `Section ${result.result.section.classLevel}-${result.result.section.name} created`,
        );
      }
      setName("");
      setStudentCount("30");
      reload();
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    const count = Number(editSeats);
    if (!editProgramId || !count) {
      toast.error("Fill program and seats.");
      return;
    }
    if (editing.kind === "section" && !editName.trim()) {
      toast.error("Section name is required.");
      return;
    }

    const teacherId = editTeacherId === NONE ? null : editTeacherId;

    startTransition(async () => {
      if (editing.kind === "section") {
        const result = await updateSectionAction(editing.row.id, {
          name: editName.trim(),
          programId: editProgramId,
          studentCount: count,
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        const ct = await setClassTeacherAction({
          kind: "section",
          sectionId: editing.row.id,
          teacherId,
        });
        if (!ct.ok) {
          toast.error(ct.message);
          return;
        }
        toast.success("Section updated");
      } else {
        const result = await updateWholeClassAction(editing.row.id, {
          programId: editProgramId,
          studentCount: count,
        });
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        // Clear old program CT if program changed
        if (editProgramId !== editing.row.programId) {
          await setClassTeacherAction({
            kind: "class",
            programId: editing.row.programId,
            classLevel: editing.row.classLevel,
            teacherId: null,
          });
        }
        const ct = await setClassTeacherAction({
          kind: "class",
          programId: editProgramId,
          classLevel: editing.row.classLevel,
          teacherId,
        });
        if (!ct.ok) {
          toast.error(ct.message);
          return;
        }
        toast.success("Class updated");
      }
      setEditing(null);
      reload();
    });
  };

  const removeSection = (section: SchoolSection) => {
    if (!window.confirm(`Delete section ${section.classLevel}-${section.name}?`)) return;
    startTransition(async () => {
      const result = await deleteSectionAction(section.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Section deleted");
      reload();
    });
  };

  const removeWholeClass = (row: WholeClass) => {
    if (!window.confirm(`Delete class ${row.classLevel} (no section)?`)) return;
    startTransition(async () => {
      const result = await deleteWholeClassAction(row.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Class deleted");
      reload();
    });
  };

  if (organization === null || strength === null) {
    return (
      <>
        <PageHeader title="Classes" description="Create a whole class or add sections." />
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center text-sm text-neutral-500 shadow-[0_4px_16px_-8px_rgb(25_28_95/0.12)]">
          Loading classes…
        </div>
      </>
    );
  }

  const sectionGroups = groupSections(organization.sections);
  const totalCount = organization.wholeClasses.length + organization.sections.length;
  const ceiling = strength.studentStrength;
  const usedPct =
    ceiling && ceiling > 0 ? Math.min(100, Math.round((strength.used / ceiling) * 100)) : 0;

  const teacherItems = [
    { value: NONE, label: "No class teacher" },
    ...eligibleTeachers.map((teacher) => ({
      value: teacher.id,
      label: capitalizeWords(teacher.name),
    })),
  ];

  return (
    <>
      <PageHeader
        title="Classes"
        count={totalCount}
        description="Leave section blank for a whole class. Fill section (A/B/C) when you need splits. Only admin-enabled classes appear."
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-brand-200 bg-linear-to-br from-brand-50/90 to-white px-5 py-4 shadow-[0_4px_16px_-8px_rgb(25_28_95/0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-700 uppercase">
                Student strength
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {ceiling == null ? (
                  <>
                    No ceiling from admin ·{" "}
                    <span className="font-semibold text-neutral-950">{strength.used}</span> seats used
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-neutral-950">{strength.used}</span>
                    <span className="text-neutral-400"> / </span>
                    <span className="font-semibold text-neutral-950">{ceiling}</span>
                    {strength.remaining != null ? (
                      <span className="text-neutral-500"> · {strength.remaining} left</span>
                    ) : null}
                  </>
                )}
              </p>
            </div>
            {ceiling != null ? (
              <div className="h-2 w-44 overflow-hidden rounded-full bg-brand-100/80">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usedPct >= 100 ? "bg-red-500" : "bg-brand-800",
                  )}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className={cn(cardShell, "p-5")}>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-950">Add class / section</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Class + program + seats. Section is optional — leave empty for whole class, or enter A/B/C
              for a section.
            </p>
          </div>

          {classOptions.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Ask admin to enrol programs and classes for this school first.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr_0.8fr_auto]">
              <Field>
                <FieldLabel>Class *</FieldLabel>
                <Select
                  value={classLevel || null}
                  onValueChange={(value) => setClassLevel(value ?? "")}
                  items={classOptions.map((level) => ({
                    value: String(level),
                    label: `Class ${level}`,
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((level) => (
                      <SelectItem key={level} value={String(level)}>
                        Class {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Section (optional)</FieldLabel>
                <Input
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value.toUpperCase())}
                  placeholder="Leave blank = whole class"
                  maxLength={32}
                />
              </Field>

              <Field>
                <FieldLabel>Program *</FieldLabel>
                <Select
                  value={programId || null}
                  onValueChange={(value) => setProgramId(value ?? "")}
                  disabled={!classLevel}
                  items={programsForClass.map((row) => ({
                    value: row.programId,
                    label: row.programName,
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={classLevel ? "Select program" : "Pick class first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programsForClass.map((row) => (
                      <SelectItem key={row.programId} value={row.programId}>
                        {row.programName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Seats *</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={5000}
                  value={studentCount}
                  onChange={(event) => setStudentCount(event.currentTarget.value)}
                />
              </Field>

              <div className="flex items-end">
                <Button type="button" className="w-full xl:w-auto" disabled={pending} onClick={create}>
                  {pending ? <Loader2 className="animate-spin" /> : <Plus />}
                  Create
                </Button>
              </div>
            </div>
          )}
        </div>

        {totalCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center text-sm text-neutral-500 shadow-[0_4px_16px_-8px_rgb(25_28_95/0.12)]">
            Nothing yet. Create a whole class (leave section blank) or add sections.
          </div>
        ) : (
          <div className={cn("space-y-4", pending && "opacity-70 transition-opacity")}>
            {organization.wholeClasses.length > 0 ? (
              <section className={cardShell}>
                <header className="border-b border-brand-100 bg-brand-50/60 px-4 py-3">
                  <h3 className="text-sm font-bold tracking-tight text-brand-950">
                    Whole classes (no section)
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Teachers get class-level subjects and class teacher for these.
                  </p>
                </header>
                <ul className="divide-y divide-brand-50">
                  {organization.wholeClasses.map((row) => {
                    const ct = classCtByKey.get(`${row.programId}:${row.classLevel}`);
                    return (
                      <li key={row.id} className="flex items-start gap-3 px-4 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-950">
                            Class {row.classLevel}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-neutral-500">
                            {capitalizeWords(row.programName)}
                          </p>
                          <p className="mt-1.5 text-xs text-neutral-600">
                            <span className="font-medium text-neutral-800">
                              {row.studentCount} seats
                            </span>
                            <span className="text-neutral-300"> · </span>
                            {ct ? (
                              <span className="font-medium text-brand-800">
                                CT {capitalizeWords(ct.teacherName)}
                              </span>
                            ) : (
                              <span className="text-neutral-400">No class teacher</span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  disabled={pending}
                                  aria-label={`Edit class ${row.classLevel}`}
                                  onClick={() => openEdit({ kind: "class", row })}
                                  className={iconBtn}
                                />
                              }
                            >
                              <Pencil className="size-3.5" strokeWidth={2} />
                            </TooltipTrigger>
                            <TooltipContent side="top">Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  disabled={pending}
                                  aria-label={`Delete class ${row.classLevel}`}
                                  onClick={() => removeWholeClass(row)}
                                  className={cn(iconBtn, "text-red-600")}
                                />
                              }
                            >
                              <Trash2 className="size-3.5" strokeWidth={2} />
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              {sectionGroups.map(([level, rows]) => (
                <section key={level} className={cardShell}>
                  <header className="flex items-center justify-between border-b border-brand-100 bg-brand-50/60 px-4 py-3">
                    <h3 className="text-sm font-bold tracking-tight text-brand-950">
                      Class {level}
                    </h3>
                    <span className="rounded-md border border-brand-200 bg-white px-2 py-0.5 text-xs font-medium text-brand-800">
                      {rows.length} section{rows.length === 1 ? "" : "s"}
                    </span>
                  </header>
                  <ul className="divide-y divide-brand-50">
                    {rows.map((section) => (
                      <li key={section.id} className="flex items-start gap-3 px-4 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-950">
                            Section {section.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-neutral-500">
                            {capitalizeWords(section.programName)}
                          </p>
                          <p className="mt-1.5 text-xs text-neutral-600">
                            <span className="font-medium text-neutral-800">
                              {section.studentCount} seats
                            </span>
                            <span className="text-neutral-300"> · </span>
                            {section.classTeacher ? (
                              <span className="font-medium text-brand-800">
                                CT {capitalizeWords(section.classTeacher.name)}
                              </span>
                            ) : (
                              <span className="text-neutral-400">No class teacher</span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  disabled={pending}
                                  aria-label={`Edit section ${section.name}`}
                                  onClick={() => openEdit({ kind: "section", row: section })}
                                  className={iconBtn}
                                />
                              }
                            >
                              <Pencil className="size-3.5" strokeWidth={2} />
                            </TooltipTrigger>
                            <TooltipContent side="top">Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  disabled={pending}
                                  aria-label={`Delete section ${section.name}`}
                                  onClick={() => removeSection(section)}
                                  className={cn(iconBtn, "text-red-600")}
                                />
                              }
                            >
                              <Trash2 className="size-3.5" strokeWidth={2} />
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!editing} onOpenChange={(open) => !open && !pending && setEditing(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editing?.kind === "class" ? "Edit class" : "Edit section"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editing ? `Class ${editing.row.classLevel}` : null}
              {editing?.kind === "section" ? ` · Section ${editing.row.name}` : " · no section"}
              . Only teachers assigned to this program and class appear below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3 py-1">
            {editing?.kind === "section" ? (
              <Field>
                <FieldLabel>Section *</FieldLabel>
                <Input
                  value={editName}
                  onChange={(event) => setEditName(event.currentTarget.value.toUpperCase())}
                  maxLength={32}
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel>Program *</FieldLabel>
              <Select
                value={editProgramId || null}
                onValueChange={(value) => {
                  setEditProgramId(value ?? "");
                  setEditTeacherId(NONE);
                }}
                items={programsForEdit.map((row) => ({
                  value: row.programId,
                  label: row.programName,
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programsForEdit.map((row) => (
                    <SelectItem key={row.programId} value={row.programId}>
                      {row.programName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Seats *</FieldLabel>
              <Input
                type="number"
                min={1}
                max={5000}
                value={editSeats}
                onChange={(event) => setEditSeats(event.currentTarget.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Class teacher</FieldLabel>
              {eligibleTeachers.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  No teachers assigned to this program and class yet. Add subject assignments on a
                  teacher first.
                </p>
              ) : (
                <Select
                  value={editTeacherId}
                  onValueChange={(value) => setEditTeacherId(value ?? NONE)}
                  items={teacherItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button type="button" disabled={pending} onClick={saveEdit}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
