"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { setOmResultReleaseAction } from "./actions";
import type { OmResultRelease } from "@/types/om-scan";

function slotKey(row: OmResultRelease) {
  return [row.testId, row.programId, row.classLevel, row.sectionId ?? "class"].join(":");
}

/**
 * Class teacher's push switch. Results stay with the class teacher until pushed; key corrections
 * rescore stored answers either way, so teachers can fix the key first and push the final result.
 */
export function ReleasePanel({ releases }: { releases: OmResultRelease[] }) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (releases.length === 0) return null;

  function toggle(row: OmResultRelease, published: boolean) {
    const key = slotKey(row);
    setBusy(key);
    setOverrides((prev) => ({ ...prev, [key]: published }));
    startTransition(async () => {
      const result = await setOmResultReleaseAction({
        testId: row.testId,
        programId: row.programId,
        classLevel: row.classLevel,
        sectionId: row.sectionId,
        published,
      });
      setBusy(null);
      // Drop the optimistic value; the refreshed page carries the saved state.
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const sheets = `${row.scanned} sheet${row.scanned === 1 ? "" : "s"}`;
      toast.success(
        published
          ? `Pushed ${sheets} for test ID ${row.testId} (test no. ${row.testNumber}) to students and subject teachers`
          : `Hid ${sheets} for test ID ${row.testId} (test no. ${row.testNumber}) from students and subject teachers`,
      );
    });
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-950">
            <Send className="size-4 text-brand-700" /> Push results
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Only you see scanned results until you push them. Key corrections rescore automatically; push when final.
          </p>
        </div>
      </div>
      <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
        {releases.map((row) => {
          const key = slotKey(row);
          const published = overrides[key] ?? row.published;
          return (
            <li key={key} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">
                  Test ID {row.testId}{" "}
                  <span className="font-medium text-neutral-500">· test no. {row.testNumber}</span>
                </p>
                <p className="text-xs text-neutral-500">
                  {row.programName} · Class {row.classLevel}
                  {row.sectionName ? `-${row.sectionName}` : ""} · {row.scanned} sheet{row.scanned === 1 ? "" : "s"} scanned
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
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
                  {published ? "Visible to students" : "Only you"}
                </span>
                <Switch
                  checked={published}
                  disabled={busy === key}
                  onCheckedChange={(next) => toggle(row, next)}
                  aria-label={`Push results for test ID ${row.testId}`}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
