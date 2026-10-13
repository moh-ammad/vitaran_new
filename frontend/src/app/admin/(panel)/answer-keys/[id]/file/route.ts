import { fetchAnswerKeyFile } from "@/services/answer-keys";

/** Streams the PDF through the app so the admin token never reaches the browser. */
export async function GET(_request: Request, { params }: RouteContext<"/admin/answer-keys/[id]/file">) {
  const { id } = await params;
  const upstream = await fetchAnswerKeyFile(id);

  if (!upstream.ok) {
    return new Response("Answer key not found", { status: upstream.status === 401 ? 401 : 404 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": upstream.headers.get("Content-Disposition") ?? "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
