import { fileResponse } from "@/features/documents/file-response";
import { fetchSchoolRankingFile } from "@/services/ranking";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  return fileResponse(request, await fetchSchoolRankingFile(query), "Ranking not found");
}
