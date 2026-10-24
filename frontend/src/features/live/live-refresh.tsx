"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useLiveContent } from "./use-live-content";

export type LiveContentKind = "answer-keys" | "results";

/**
 * Re-renders the page when the admin publishes, hides, edits or deletes this kind of content,
 * so schools/teachers/students see changes without reloading.
 */
export function LiveRefresh({ kind, as }: { kind: LiveContentKind; as?: "student" }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  useLiveContent(kind, refresh, as);
  return null;
}
