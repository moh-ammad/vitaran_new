import { fileResponse } from "@/features/documents/file-response";
import { fetchTeacherAnswerKeyFile } from "@/services/answer-keys";

export async function GET(request: Request, { params }: RouteContext<"/answer-keys/[id]/file">) {
  return fileResponse(
    request,
    await fetchTeacherAnswerKeyFile((await params).id),
    "Answer key not found",
  );
}
