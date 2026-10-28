"use server";

import { getAdminAnalysis, getSchoolAnalysis, getTeacherAnalysis } from "@/services/analysis";
import type { AnalysisReport } from "@/types/analysis";
import { analysisApiQuery, type AnalysisParams } from "./query";

export async function loadAnalysisAction(
  role: "admin" | "school" | "teacher",
  params: AnalysisParams,
): Promise<AnalysisReport> {
  const query = analysisApiQuery(params);
  if (role === "admin") return getAdminAnalysis(query);
  if (role === "school") return getSchoolAnalysis(query);
  return getTeacherAnalysis(query);
}
