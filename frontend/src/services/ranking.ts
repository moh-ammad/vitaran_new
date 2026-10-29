import "server-only";
import { adminApi, adminFetch } from "@/services/admin-api";
import { schoolApi, schoolFetch } from "@/services/school-api";
import { studentApi } from "@/services/student-api";
import { teacherApi, teacherFetch } from "@/services/teacher-api";
import type { RankingReport } from "@/types/ranking";

export function getAdminRanking(query = "") {
  return adminApi<RankingReport>(`/analysis/ranking${query}`);
}

export function getSchoolRanking(query = "") {
  return schoolApi<RankingReport>(`/school/analysis/ranking${query}`);
}

export function getTeacherRanking(query = "") {
  return teacherApi<RankingReport>(`/teacher/analysis/ranking${query}`);
}

export function getStudentRanking(query = "") {
  return studentApi<RankingReport>(`/student/analysis/ranking${query}`);
}

export function fetchAdminRankingFile(query: string) {
  return adminFetch(`/analysis/ranking/file${query}`);
}

export function fetchSchoolRankingFile(query: string) {
  return schoolFetch(`/school/analysis/ranking/file${query}`);
}

export function fetchTeacherRankingFile(query: string) {
  return teacherFetch(`/teacher/analysis/ranking/file${query}`);
}
