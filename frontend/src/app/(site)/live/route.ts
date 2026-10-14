import { cookies } from "next/headers";
import { SCHOOL_SESSION_COOKIE } from "@/constants/auth";
import { buildApiUrl } from "@/services/api-client";

export const dynamic = "force-dynamic";

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

/** Relays the API's live-update stream to the signed-in school's browser. */
export async function GET(request: Request) {
  const token = (await cookies()).get(SCHOOL_SESSION_COOKIE)?.value;
  if (!token) return new Response(null, { status: 401 });

  try {
    const upstream = await fetch(buildApiUrl("/school/events"), {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      cache: "no-store",
      signal: request.signal,
    });
    if (!upstream.ok || !upstream.body) {
      return new Response(null, { status: upstream.status === 401 ? 401 : 502 });
    }
    return new Response(upstream.body, { headers: STREAM_HEADERS });
  } catch {
    return new Response(null, { status: 502 });
  }
}
