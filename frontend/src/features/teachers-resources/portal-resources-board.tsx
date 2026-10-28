"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { PageHeader } from "@/features/admin/page-header";
import { cn } from "@/lib/utils";
import {
  loadSchoolPortalResourcesAction,
  loadTeacherPortalResourcesAction,
  type PortalResourcesPayload,
} from "./portal-resources-action";
import { loadStudentPortalResourcesAction } from "./student-resources-action";
import { ResourcePage } from "./resource-page";
import { solutionBooks } from "./solution-books";

type PortalResourcesBoardProps = {
  role: "school" | "teacher" | "student";
  description: string;
  initialPayload: PortalResourcesPayload;
};

/** Reloads offerings/assignments so admin class changes show without a hard refresh. */
export function PortalResourcesBoard({ role, description, initialPayload }: PortalResourcesBoardProps) {
  const [payload, setPayload] = useState(initialPayload);
  const [pending, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const next =
        role === "school"
          ? await loadSchoolPortalResourcesAction()
          : role === "student"
            ? await loadStudentPortalResourcesAction()
            : await loadTeacherPortalResourcesAction();
      setPayload(next);
    });
  }, [role]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const cacheKey = payload.assignments
    .map((row) => `${row.programCode}:${row.classLevel}:${row.subject}`)
    .sort()
    .join("|");

  return (
    <>
      <PageHeader title="Resources" description={description} />
      <div className={cn("-mx-4 -mb-4 sm:-mx-5 lg:-mx-6", pending && "opacity-70 transition-opacity")}>
        <ResourcePage
          key={cacheKey}
          title={role === "student" ? "Your" : "Teachers"}
          highlight="Resources"
          books={solutionBooks}
          programIds={payload.programIds}
          subjectIds={payload.subjectIds}
          assignments={payload.assignments}
          label="Solution Books"
          emptyMessage="Solution books for your subjects in this program will be available here soon."
          compact
        />
      </div>
    </>
  );
}
