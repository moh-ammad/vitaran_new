import { fileResponse } from "@/features/documents/file-response";
import { fetchTeacherAnswerKeyFile } from "@/services/answer-keys";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return fileResponse(
    request,
    await fetchTeacherAnswerKeyFile((await params).id),
    "Answer key not found",
  );
}
