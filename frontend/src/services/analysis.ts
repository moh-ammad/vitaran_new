import "server-only";
import { adminApi } from "@/services/admin-api";
import { schoolApi } from "@/services/school-api";
import { teacherApi } from "@/services/teacher-api";
import type { AnalysisReport } from "@/types/analysis";

export function getAdminAnalysis(query = "") {
  return adminApi<AnalysisReport>(`/analysis${query}`);
}

export function getSchoolAnalysis(query = "") {
  return schoolApi<AnalysisReport>(`/school/analysis${query}`);
}

export function getTeacherAnalysis(query = "") {
  return teacherApi<AnalysisReport>(`/teacher/analysis${query}`);
}
