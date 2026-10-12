import "server-only";
import { ApiError } from "@/services/api-client";
import { adminApi } from "@/services/admin-api";
import type {
  School,
  SchoolBoard,
  SchoolInput,
  SchoolList,
  SchoolStats,
  SchoolStatus,
} from "@/types/school";

export type SchoolListParams = {
  search?: string;
  status?: SchoolStatus;
  board?: SchoolBoard;
  page?: number;
  pageSize?: number;
};

export function listSchools(params: SchoolListParams = {}) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }

  const suffix = query.size > 0 ? `?${query}` : "";
  return adminApi<SchoolList>(`/schools${suffix}`);
}

export function getSchoolStats() {
  return adminApi<SchoolStats>("/schools/stats");
}

export async function getSchool(id: string): Promise<School | null> {
  try {
    return await adminApi<School>(`/schools/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

export function createSchool(input: SchoolInput) {
  return adminApi<School>("/schools", { method: "POST", body: input });
}

export function updateSchool(id: string, input: SchoolInput) {
  return adminApi<School>(`/schools/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteSchool(id: string) {
  return adminApi<void>(`/schools/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
