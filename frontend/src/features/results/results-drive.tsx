"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Folder,
  GraduationCap,
  Pencil,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { wasEdited } from "@/features/documents/constants";
import { PublishSwitch } from "@/features/documents/publish-switch";
import { programLabel } from "@/features/schools/constants";
import type { DeleteResult } from "@/types/document";
import type { LearningProgram } from "@/types/program";
import type { ResultSet } from "@/types/result";
import { formatDate, formatNumber } from "@/utils/format";
import {
  RESULTS_PATH,
  resultEditHref,
  resultSetHref,
  resultSheetDownloadHref,
} from "./constants";
import { DRIVE_CLASSES, DRIVE_TESTS, type DrivePath, type DriveSchool } from "./drive-path";
import { ResultUploadSheet } from "./result-upload-sheet";

export type { DrivePath, DriveSchool } from "./drive-path";

type FolderRow = {
  key: string;
  name: string;
  href: string;
  kind: "program" | "school" | "test";
  hint?: string;
};

type ResultsDriveProps = {
  resultSets: ResultSet[];
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
    if (!path.program) params.set("type", "CUSTOMIZED");
    params.set("school", path.schoolId);
  }
  if (path.testNumber) params.set("test", String(path.testNumber));
  const q = params.toString();
  return q ? `${RESULTS_PATH}?${q}` : RESULTS_PATH;
}

function findResultSet(resultSets: ResultSet[], path: DrivePath) {
  if (!path.schoolId || path.testNumber === undefined) return undefined;
  return resultSets.find((item) => {
    if (item.school.id !== path.schoolId) return false;
    if (item.testNumber !== path.testNumber) return false;
    if (path.program) return item.program === path.program;
    return item.school.type === "CUSTOMIZED";
  });
}

const TILE =
  "group flex flex-col items-start gap-3 rounded-2xl border border-teal-100/90 bg-white p-4 text-left shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50/60 hover:shadow-md";

const TILE_COMPACT =
  "group flex items-center gap-3 rounded-xl border border-teal-100/90 bg-white px-3 py-3 text-left shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50/60 hover:shadow-md";

export function ResultsDrive({
  resultSets,
  programs,
  schools,
  path,
  publishAction,
}: ResultsDriveProps) {
  const router = useRouter();
  const [uploadPath, setUploadPath] = useState<DrivePath | null>(null);

  const customizedOnly = schools.filter((school) => school.type === "CUSTOMIZED");
  const regularOnly = schools.filter((school) => school.type === "REGULAR");

  const programName = (code: string) =>
    programLabel(code, programs.find((program) => program.code === code)?.name);

  const currentSchool =
    schools.find((school) => school.id === path.schoolId) ??
    resultSets.find((item) => item.school.id === path.schoolId)?.school;

  const activeSet = findResultSet(resultSets, path);

  const breadcrumbs: { label: string; href: string }[] = [{ label: "Programs", href: RESULTS_PATH }];
  if (path.program) {
    breadcrumbs.push({
      label: programName(path.program),
      href: hrefFor({ program: path.program }),
    });
  }
  if (path.schoolId) {
    breadcrumbs.push({
      label: currentSchool?.name ?? "School",
      href: hrefFor({ program: path.program, schoolId: path.schoolId }),
    });
  }
  if (path.testNumber) {
    breadcrumbs.push({
      label: `Test ${path.testNumber}`,
      href: hrefFor({
        program: path.program,
        schoolId: path.schoolId,
        testNumber: path.testNumber,
      }),
    });
  }

  const atRoot = !path.program && !path.schoolId;
  const inProgramOnly = Boolean(path.program && !path.schoolId);
  const inSchool = Boolean(path.schoolId);
  const inTest = inSchool && path.testNumber !== undefined;

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
        hint: "Regular",
      }));

    const schoolIds = new Set([
      ...customizedOnly.map((school) => school.id),
      ...resultSets
        .filter((item) => item.school.type === "CUSTOMIZED")
        .map((item) => item.school.id),
    ]);
    const schoolFolders = [...schoolIds]
      .map((id) => {
        const school =
          customizedOnly.find((item) => item.id === id) ??
          resultSets.find((item) => item.school.id === id)?.school;
        return {
          key: `school:${id}`,
          name: school?.name ?? id,
          href: hrefFor({ schoolId: id }),
          kind: "school" as const,
          hint: "Custom school",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    folders = [...programFolders, ...schoolFolders];
  } else if (inProgramOnly) {
    folders = regularOnly
      .filter((school) => school.programs?.includes(path.program!))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((school) => ({
        key: school.id,
        name: school.name,
        href: hrefFor({ program: path.program, schoolId: school.id }),
        kind: "school" as const,
        hint: school.code,
      }));
  } else if (inSchool && !inTest) {
    folders = DRIVE_TESTS.map((testNumber) => ({
      key: String(testNumber),
      name: `Test ${testNumber}`,
      href: hrefFor({ program: path.program, schoolId: path.schoolId, testNumber }),
      kind: "test" as const,
    }));
  }

  const openUpload = (classLevel: number) => {
    setUploadPath({ ...path, classLevel });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-[0_10px_30px_-18px_rgb(15_118_110/0.28)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-teal-700/30 bg-linear-to-r from-teal-700 to-teal-950 px-5 py-3.5">
        {breadcrumbs.map((crumb, index) => {
          const last = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3.5 text-teal-300" /> : null}
              {last ? (
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-sm font-semibold text-white backdrop-blur">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="rounded-lg px-2.5 py-1 text-sm text-teal-100/90 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      <ResultUploadSheet
        open={uploadPath !== null}
        onOpenChange={(open) => {
          if (!open) setUploadPath(null);
        }}
        path={uploadPath ?? path}
        schools={schools}
        programs={programs}
        resultSet={activeSet}
      />

      <div className="bg-linear-to-b from-teal-50/90 to-white">
        {!inTest ? (
          folders.length === 0 ? (
            <div className="px-6 py-20 text-center text-sm text-teal-400">
              {inProgramOnly ? "No schools in this program" : "No programs yet"}
            </div>
          ) : atRoot || inProgramOnly ? (
            <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {folders.map((folder) => (
                <button
                  key={folder.key}
                  type="button"
                  onClick={() => router.push(folder.href)}
                  className={TILE}
                >
                  <FolderIcon kind={folder.kind} />
                  <span className="line-clamp-2 w-full text-sm font-semibold text-teal-950">
                    {folder.name}
                  </span>
                  {folder.hint ? (
                    <span className="text-[11px] font-medium text-teal-600/80">{folder.hint}</span>
                  ) : null}
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
                  <span className="truncate text-sm font-semibold text-teal-950">{folder.name}</span>
                </button>
              ))}
            </div>
          )
        ) : null}

        {inTest ? (
          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {DRIVE_CLASSES.map((classLevel) => {
              const sheet = activeSet?.classes.find((item) => item.classLevel === classLevel);
              const updated =
                sheet && activeSet && wasEdited({ createdAt: activeSet.createdAt, updatedAt: sheet.updatedAt })
                  ? formatDate(sheet.updatedAt)
                  : null;

              if (!sheet || !activeSet) {
                return (
                  <button
                    key={classLevel}
                    type="button"
                    onClick={() => openUpload(classLevel)}
                    className={cn(
                      TILE,
                      "border-dashed border-teal-200 bg-teal-50/40 hover:border-emerald-300 hover:bg-white",
                    )}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-white text-teal-400 shadow-sm ring-1 ring-teal-100 transition-all group-hover:scale-105 group-hover:bg-teal-700 group-hover:text-white group-hover:ring-teal-700">
                      <Upload className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className="w-full">
                      <span className="block text-sm font-semibold text-teal-950">Class {classLevel}</span>
                      <span className="mt-0.5 block text-xs font-medium text-teal-600/80">Upload file</span>
                    </span>
                  </button>
                );
              }

              return (
                <div key={classLevel} className={cn(TILE, "relative")}>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-800 text-white shadow-sm transition-transform group-hover:scale-105">
                    <FileSpreadsheet className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="w-full min-w-0">
                    <span className="block text-sm font-semibold text-teal-950">Class {classLevel}</span>
                    <span className="mt-0.5 block truncate text-xs text-teal-600/80" title={sheet.fileName}>
                      {updated ?? `${formatNumber(sheet.rowCount)} students`}
                    </span>
                  </span>
                  <div className="flex w-full items-center justify-between gap-2 pt-0.5">
                    <PublishSwitch
                      published={activeSet.published}
                      label={`Test ${activeSet.testNumber}`}
                      onToggle={publishAction.bind(null, activeSet.id)}
                    />
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={resultSetHref(RESULTS_PATH, activeSet.id, classLevel)}
                        aria-label={`View class ${classLevel}`}
                        title="View"
                        className={TILE_ACTION}
                      >
                        <Eye />
                      </Link>
                      <a
                        href={resultSheetDownloadHref(RESULTS_PATH, activeSet.id, classLevel)}
                        aria-label={`Download class ${classLevel}`}
                        title="Download"
                        className={TILE_ACTION}
                      >
                        <FileSpreadsheet />
                      </a>
                      <Link
                        href={resultEditHref(activeSet.id)}
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
          "flex items-center justify-center bg-linear-to-br from-cyan-400 to-teal-700 text-white shadow-sm transition-transform group-hover:scale-105",
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
          "flex items-center justify-center bg-linear-to-br from-emerald-500 to-teal-800 text-white shadow-sm transition-transform group-hover:scale-105",
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
        "flex items-center justify-center bg-linear-to-br from-teal-600 to-teal-950 text-teal-100 shadow-sm transition-transform group-hover:scale-105",
        size,
      )}
    >
      <Folder className={cn(icon, "fill-teal-200/70")} strokeWidth={1.75} />
    </span>
  );
}

const TILE_ACTION =
  "inline-flex size-7 items-center justify-center rounded-lg text-teal-500 transition-colors hover:bg-teal-100 hover:text-teal-900 [&_svg]:size-3.5";
