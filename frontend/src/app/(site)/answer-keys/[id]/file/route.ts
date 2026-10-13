import { fileResponse } from "@/features/documents/file-response";
import { fetchSchoolAnswerKeyFile } from "@/services/answer-keys";

export async function GET(request: Request, { params }: RouteContext<"/answer-keys/[id]/file">) {
  return fileResponse(request, await fetchSchoolAnswerKeyFile((await params).id), "Answer key not found");
}
