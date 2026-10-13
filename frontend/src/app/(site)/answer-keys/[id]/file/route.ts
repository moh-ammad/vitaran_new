import type { NextRequest } from "next/server";
import { fetchSchoolAnswerKeyFile } from "@/services/school-answer-keys";

/**
 * Streams the PDF through the app so the school token never reaches the browser.
 * `?download=1` saves the file instead of opening it.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/answer-keys/[id]/file">) {
  const { id } = await params;
  const upstream = await fetchSchoolAnswerKeyFile(id);

  if (!upstream.ok) {
    return new Response("Answer key not found", { status: upstream.status === 401 ? 401 : 404 });
  }

  const disposition = upstream.headers.get("Content-Disposition") ?? "inline";
  const download = request.nextUrl.searchParams.has("download");

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": download ? disposition.replace(/^inline/, "attachment") : disposition,
      "Cache-Control": "private, no-store",
    },
  });
}
