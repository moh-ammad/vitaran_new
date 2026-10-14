"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type LiveContentKind = "answer-keys" | "results";

const LIVE_PATH = "/live";
/** Several changes in a row (e.g. publishing a batch) cause one refresh. */
const REFRESH_DEBOUNCE_MS = 300;
const MAX_RETRY_MS = 30_000;

/**
 * Re-renders the page when the admin publishes, hides, edits or deletes this kind of content,
 * so schools see changes without reloading.
 */
export function LiveRefresh({ kind }: { kind: LiveContentKind }) {
  const router = useRouter();

  useEffect(() => {
    let source: EventSource | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let connectedBefore = false;

    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
    };

    const connect = () => {
      source = new EventSource(LIVE_PATH);

      source.onopen = () => {
        attempts = 0;
        // Changes made while disconnected were missed, so catch up.
        if (connectedBefore) refresh();
        connectedBefore = true;
      };

      source.addEventListener("change", (event) => {
        const data = JSON.parse((event as MessageEvent<string>).data) as { kind: LiveContentKind };
        if (data.kind === kind) refresh();
      });

      // The browser retries dropped streams itself, but gives up on error responses.
      source.onerror = () => {
        if (source?.readyState !== EventSource.CLOSED) return;
        retryTimer = setTimeout(connect, Math.min(MAX_RETRY_MS, 2_000 * 2 ** attempts++));
      };
    };

    connect();
    return () => {
      source?.close();
      clearTimeout(retryTimer);
      clearTimeout(refreshTimer);
    };
  }, [kind, router]);

  return null;
}
