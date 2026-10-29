import { fileResponse } from "@/features/documents/file-response";
import { fetchAdminRankingFile } from "@/services/ranking";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  return fileResponse(request, await fetchAdminRankingFile(query), "Ranking not found");
}
