"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  Eye,
  FileText,
  Folder,
  GraduationCap,
  Pencil,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  documentEditHref,
  documentFileHref,
  wasEdited,
} from "@/features/documents/constants";
import { PublishSwitch } from "@/features/documents/publish-switch";
import { programLabel } from "@/features/schools/constants";
import type { AnswerKey } from "@/types/answer-key";
import type { DeleteResult } from "@/types/document";
import type { LearningProgram } from "@/types/program";
import { formatDate } from "@/utils/format";
import { AnswerKeyUploadSheet } from "./answer-key-upload-sheet";
import { ANSWER_KEYS_PATH } from "./constants";
import { DRIVE_CLASSES, DRIVE_TESTS, type DrivePath, type DriveSchool } from "./drive-path";

export type { DrivePath, DriveSchool } from "./drive-path";

type FolderRow = {
  key: string;
  name: string;
  href: string;
  kind: "program" | "school" | "test";
};

type AnswerKeysDriveProps = {
  items: AnswerKey[];
  programs: LearningProgram[];
  schools: DriveSchool[];
  path: DrivePath;
  publishAction: (id: string, published: boolean) => Promise<DeleteResult>;
};

function hrefFor(path: DrivePath) {
  const params = new URLSearchParams();
  if (path.program) {
    params.set("type", "REGULAR");
    params.set("program", path.program);
  }
  if (path.schoolId) {
    params.set("type", "CUSTOMIZED");
    params.set("school", path.schoolId);
  }
  if (path.testNumber) params.set("test", String(path.testNumber));
  const q = params.toString();
  return q ? `${ANSWER_KEYS_PATH}?${q}` : ANSWER_KEYS_PATH;
}

function scopedItems(items: AnswerKey[], path: DrivePath) {
  return items.filter((item) => {
    if (path.program) return item.type === "REGULAR" && item.program === path.program;
    if (path.schoolId) return item.type === "CUSTOMIZED" && item.school?.id === path.schoolId;
    return false;
  });
}

function fileForClass(items: AnswerKey[], path: DrivePath, classLevel: number) {
  return scopedItems(items, path).find(
    (item) => item.testNumber === path.testNumber && item.classLevel === classLevel,
  );
}

const TILE =
  "group flex flex-col items-start gap-3 rounded-2xl border border-brand-100/80 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-md";

const TILE_COMPACT =
  "group flex items-center gap-3 rounded-xl border border-brand-100/80 bg-white px-3 py-3 text-left shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-md";

export function AnswerKeysDrive({
  items,
  programs,
  schools,
  path,
  publishAction,
}: AnswerKeysDriveProps) {
  const router = useRouter();
  const [uploadPath, setUploadPath] = useState<DrivePath | null>(null);
  const customizedOnly = schools.filter((school) => school.type === "CUSTOMIZED");
  const programName = (code: string) =>
    programLabel(code, programs.find((program) => program.code === code)?.name);

  const currentSchool =
    customizedOnly.find((school) => school.id === path.schoolId) ??
    items.find((item) => item.school?.id === path.schoolId)?.school;

  const curriculumProgram =
    path.program ??
    customizedOnly.find((school) => school.id === path.schoolId)?.programs?.[0] ??
    programs[0]?.code;

  const breadcrumbs: { label: string; href: string }[] = [{ label: "Programs", href: ANSWER_KEYS_PATH }];
  if (path.program) {
    breadcrumbs.push({
      label: programName(path.program),
      href: hrefFor({ program: path.program }),
    });
  }
  if (path.schoolId) {
    breadcrumbs.push({
      label: currentSchool?.name ?? "School",
      href: hrefFor({ schoolId: path.schoolId }),
    });
  }
  if (path.testNumber) {
    breadcrumbs.push({
      label: `Test ${path.testNumber}`,
      href: hrefFor({ program: path.program, schoolId: path.schoolId, testNumber: path.testNumber }),
    });
  }

  const atRoot = !path.program && !path.schoolId;
  const inOwner = Boolean(path.program || path.schoolId);
  const inTest = inOwner && path.testNumber !== undefined;

  let folders: FolderRow[] = [];

  if (atRoot) {
    const programFolders = programs
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((program) => ({
        key: `program:${program.code}`,
        name: programLabel(program.code, program.name),
        href: hrefFor({ program: program.code }),
        kind: "program" as const,
      }));

    const schoolIds = new Set([
      ...customizedOnly.map((school) => school.id),
      ...items
        .filter((item) => item.type === "CUSTOMIZED" && item.school)
        .map((item) => item.school!.id),
    ]);
    const schoolFolders = [...schoolIds]
      .map((id) => {
        const school =
          customizedOnly.find((item) => item.id === id) ??
          items.find((item) => item.school?.id === id)?.school;
        return {
          key: `school:${id}`,
          name: school?.name ?? id,
          href: hrefFor({ schoolId: id }),
          kind: "school" as const,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    folders = [...programFolders, ...schoolFolders];
  } else if (inOwner && !inTest) {
    folders = DRIVE_TESTS.map((testNumber) => ({
      key: String(testNumber),
      name: `Test ${testNumber}`,
      href: hrefFor({ ...path, testNumber }),
      kind: "test" as const,
    }));
  }

  const openUpload = (classLevel: number) => {
    setUploadPath({ ...path, classLevel });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_10px_30px_-18px_rgb(25_28_95/0.35)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-brand-100 bg-linear-to-r from-brand-800 to-brand-950 px-5 py-3.5">
        {breadcrumbs.map((crumb, index) => {
          const last = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3.5 text-brand-400" /> : null}
              {last ? (
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold text-white backdrop-blur">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="rounded-lg px-2.5 py-1 text-sm text-brand-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      <AnswerKeyUploadSheet
        open={uploadPath !== null}
        onOpenChange={(open) => {
          if (!open) setUploadPath(null);
        }}
        path={uploadPath ?? path}
        curriculumProgram={curriculumProgram}
        programs={programs}
      />

      <div className="bg-linear-to-b from-brand-50/80 to-white">
        {atRoot || (inOwner && !inTest) ? (
          folders.length === 0 ? (
            <div className="px-6 py-20 text-center text-sm text-brand-400">No programs yet</div>
          ) : atRoot ? (
            <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {folders.map((folder) => (
                <button
                  key={folder.key}
                  type="button"
                  onClick={() => router.push(folder.href)}
                  className={TILE}
                >
                  <FolderIcon kind={folder.kind} />
                  <span className="line-clamp-2 w-full text-sm font-semibold text-brand-900">
                    {folder.name}
                  </span>
                  <span className="text-[11px] font-medium text-brand-500">
                    {folder.kind === "school" ? "Custom school" : "Regular"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {folders.map((folder) => (
                <button
                  key={folder.key}
                  type="button"
                  onClick={() => router.push(folder.href)}
                  className={TILE_COMPACT}
                >
                  <FolderIcon kind="test" compact />
                  <span className="truncate text-sm font-semibold text-brand-900">{folder.name}</span>
                </button>
              ))}
            </div>
          )
        ) : null}

        {inTest ? (
          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {DRIVE_CLASSES.map((classLevel) => {
              const file = fileForClass(items, path, classLevel);
              const updated = file && wasEdited(file) ? formatDate(file.updatedAt) : null;

              if (!file) {
                return (
                  <button
                    key={classLevel}
                    type="button"
                    onClick={() => openUpload(classLevel)}
                    className={cn(
                      TILE,
                      "border-dashed border-brand-200/90 bg-brand-50/30 hover:border-glow/40 hover:bg-white",
                    )}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-white text-brand-400 shadow-sm ring-1 ring-brand-100 transition-all group-hover:scale-105 group-hover:bg-brand-800 group-hover:text-white group-hover:ring-brand-800">
                      <Upload className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className="w-full">
                      <span className="block text-sm font-semibold text-brand-900">Class {classLevel}</span>
                      <span className="mt-0.5 block text-xs font-medium text-brand-500">Upload file</span>
                    </span>
                  </button>
                );
              }

              return (
                <div key={classLevel} className={cn(TILE, "relative")}>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-brand-700 to-brand-900 text-white shadow-sm transition-transform group-hover:scale-105">
                    <FileText className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="w-full min-w-0">
                    <span className="block text-sm font-semibold text-brand-900">Class {classLevel}</span>
                    <span className="mt-0.5 block truncate text-xs text-brand-500" title={file.fileName}>
                      {updated ?? file.fileName}
                    </span>
                  </span>
                  <div className="flex w-full items-center justify-between gap-2 pt-0.5">
                    <PublishSwitch
                      published={file.published}
                      label={file.fileName}
                      onToggle={publishAction.bind(null, file.id)}
                    />
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={documentFileHref(ANSWER_KEYS_PATH, file.id)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View class ${classLevel}`}
                        title="View"
                        className={TILE_ACTION}
                      >
                        <Eye />
                      </a>
                      <Link
                        href={documentEditHref(ANSWER_KEYS_PATH, file.id)}
                        aria-label={`Edit class ${classLevel}`}
                        title="Edit"
                        className={TILE_ACTION}
                      >
                        <Pencil />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FolderIcon({ kind, compact }: { kind: FolderRow["kind"]; compact?: boolean }) {
  const size = compact ? "size-9 rounded-lg" : "size-11 rounded-xl";
  const icon = compact ? "size-4" : "size-5";

  if (kind === "school") {
    return (
      <span
        className={cn(
          "flex items-center justify-center bg-linear-to-br from-glow/90 to-brand-600 text-white shadow-sm transition-transform group-hover:scale-105",
          size,
        )}
      >
        <Building2 className={icon} strokeWidth={1.75} />
      </span>
    );
  }

  if (kind === "test") {
    return (
      <span
        className={cn(
          "flex items-center justify-center bg-linear-to-br from-brand-600 to-brand-800 text-white shadow-sm transition-transform group-hover:scale-105",
          size,
        )}
      >
        <GraduationCap className={icon} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center bg-linear-to-br from-brand-700 to-brand-950 text-amber-200 shadow-sm transition-transform group-hover:scale-105",
        size,
      )}
    >
      <Folder className={cn(icon, "fill-amber-200/80")} strokeWidth={1.75} />
    </span>
  );
}

const TILE_ACTION =
  "inline-flex size-7 items-center justify-center rounded-lg text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-900 [&_svg]:size-3.5";
