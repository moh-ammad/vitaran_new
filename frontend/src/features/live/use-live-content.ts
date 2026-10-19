"use client";

import { useEffect } from "react";
import type { LiveContentKind } from "./live-refresh";

const LIVE_PATH = "/live";
const REFRESH_DEBOUNCE_MS = 300;
const MAX_RETRY_MS = 30_000;

/**
 * Calls `onChange` when the admin publishes/hides/edits this content kind,
 * so portal pages update without a manual refresh.
 */
export function useLiveContent(kind: LiveContentKind, onChange: () => void) {
  useEffect(() => {
    let source: EventSource | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let connectedBefore = false;

    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(onChange, REFRESH_DEBOUNCE_MS);
    };

    const connect = () => {
      source = new EventSource(LIVE_PATH);

      source.onopen = () => {
        attempts = 0;
        if (connectedBefore) refresh();
        connectedBefore = true;
      };

      source.addEventListener("change", (event) => {
        const data = JSON.parse((event as MessageEvent<string>).data) as {
          kind: LiveContentKind;
        };
        if (data.kind === kind) refresh();
      });

      source.onerror = () => {
        if (source?.readyState !== EventSource.CLOSED) return;
        source.close();
        retryTimer = setTimeout(connect, Math.min(MAX_RETRY_MS, 2_000 * 2 ** attempts++));
      };
    };

    connect();
    return () => {
      source?.close();
      clearTimeout(retryTimer);
      clearTimeout(refreshTimer);
    };
  }, [kind, onChange]);
}
