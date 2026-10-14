import type { RequestHandler } from "express";
import type { SchoolAccountDto } from "../services/school.service.js";
import { onContentChanged } from "../utils/content-events.js";

/** Proxies and load balancers drop idle connections; a comment line every 25s keeps it open. */
const HEARTBEAT_MS = 25_000;
const RETRY_MS = 5_000;

/** Server-sent events telling a signed-in school when its answer keys or results change. */
export const streamSchoolEvents: RequestHandler = (req, res) => {
  const school = res.locals.school as SchoolAccountDto;

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write(`retry: ${RETRY_MS}\n\n`);

  const unsubscribe = onContentChanged(({ kind, schoolId }) => {
    if (schoolId && schoolId !== school.id) return;
    res.write(`event: change\ndata: ${JSON.stringify({ kind })}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
};
