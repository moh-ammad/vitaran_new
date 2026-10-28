"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { setOmResultReleaseAction } from "./actions";
import type { OmResultRelease } from "@/types/om-scan";

function slotKey(row: OmResultRelease) {
  return [row.testId, row.programId, row.classLevel, row.sectionId ?? "class"].join(":");
}

function classLabel(row: OmResultRelease) {
  return row.sectionName ? `Class ${row.classLevel}-${row.sectionName}` : `Class ${row.classLevel}`;
}

export function ReleasePanel({ releases }: { releases: OmResultRelease[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(releases);
  const [seen, setSeen] = useState(releases);
  const held = useRef<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (seen !== releases) {
    setSeen(releases);
    setRows(
      releases.map((row) => {
        const key = slotKey(row);
        const local = held.current[key];
        if (local == null) return row;
        if (local === row.published) {
          delete held.current[key];
          return row;
        }
        return { ...row, published: local };
      }),
    );
  }

  if (rows.length === 0) return null;

  function toggle(row: OmResultRelease, published: boolean) {
    const key = slotKey(row);
    held.current[key] = published;
    setBusy(key);
    setRows((prev) => prev.map((item) => (slotKey(item) === key ? { ...item, published } : item)));
    startTransition(async () => {
      const result = await setOmResultReleaseAction({
        testId: row.testId,
        programId: row.programId,
        classLevel: row.classLevel,
        sectionId: row.sectionId,
        published,
      });
      setBusy(null);
      if (!result.ok) {
        delete held.current[key];
        setRows((prev) => prev.map((item) => (slotKey(item) === key ? { ...item, published: row.published } : item)));
        toast.error(result.message);
        return;
      }
      const next = result.release?.published ?? published;
      held.current[key] = next;
      setRows((prev) => prev.map((item) => (slotKey(item) === key ? { ...item, published: next } : item)));
      toast.success(next ? "Results published." : "Results hidden.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
      <h2 className="mb-2 text-sm font-bold text-neutral-950">Publish results</h2>
      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
        {rows.map((row) => {
          const key = slotKey(row);
          const published = row.published;
          return (
            <li key={key} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  Test {row.testNumber} · ID {row.testId}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {classLabel(row)} · {row.programName} · {row.scanned} scanned
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                  published ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-600",
                )}
              >
                {busy === key ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : published ? (
                  <Eye className="size-3" />
                ) : (
                  <EyeOff className="size-3" />
                )}
                {published ? "Showing" : "Hidden"}
              </span>
              <Switch
                checked={published}
                disabled={busy === key}
                onCheckedChange={(next) => toggle(row, next)}
                aria-label={
                  published
                    ? `Hide results for test ${row.testId}`
                    : `Show results for test ${row.testId}`
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
