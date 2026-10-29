import { fileResponse } from "@/features/documents/file-response";
import { fetchTeacherRankingFile } from "@/services/ranking";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  return fileResponse(request, await fetchTeacherRankingFile(query), "Ranking not found");
}
