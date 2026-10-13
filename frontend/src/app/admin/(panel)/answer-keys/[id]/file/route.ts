import { fileResponse } from "@/features/documents/file-response";
import { fetchAnswerKeyFile } from "@/services/answer-keys";

export async function GET(request: Request, { params }: RouteContext<"/admin/answer-keys/[id]/file">) {
  return fileResponse(request, await fetchAnswerKeyFile((await params).id), "Answer key not found");
}
