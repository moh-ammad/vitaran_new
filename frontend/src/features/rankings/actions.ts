"use server";

import {
  getAdminRanking,
  getSchoolRanking,
  getStudentRanking,
  getTeacherRanking,
} from "@/services/ranking";
import type { RankingReport } from "@/types/ranking";
import { rankingApiQuery, type RankingParams, type RankingRole } from "./query";

export async function loadRankingAction(role: RankingRole, params: RankingParams): Promise<RankingReport> {
  const query = rankingApiQuery(params);
  if (role === "admin") return getAdminRanking(query);
  if (role === "school") return getSchoolRanking(query);
  if (role === "teacher") return getTeacherRanking(query);
  return getStudentRanking(query);
}
