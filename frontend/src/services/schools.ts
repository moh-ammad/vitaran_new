import "server-only";
import { ApiError } from "@/services/api-client";
import { adminApi } from "@/services/admin-api";
import type {
  School,
  SchoolBoard,
  SchoolDetail,
  SchoolInput,
  SchoolList,
  SchoolStats,
  SchoolStatus,
  SchoolType,
} from "@/types/school";

export type SchoolListParams = {
  search?: string;
  status?: SchoolStatus;
  board?: SchoolBoard;
  type?: SchoolType;
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

/** Options for pickers that target a single customized school. */
export async function listCustomizedSchoolOptions() {
  const { items } = await listSchools({ type: "CUSTOMIZED", pageSize: 100 });
  return items.map(({ id, name, code }) => ({ id, name, code }));
}

/** Options for pickers that target any school, with its type and enrolled programs. */
export async function listSchoolOptions() {
  const { items } = await listSchools({ pageSize: 100 });
  return items.map(({ id, name, code, type, programCodes, schoolPrograms }) => ({
    id,
    name,
    code,
    type,
    programs: programCodes,
    programLabels: Object.fromEntries(
      schoolPrograms.map((row) => [row.programCode, row.programName]),
    ),
  }));
}

export function getSchoolStats() {
  return adminApi<SchoolStats>("/schools/stats");
}

export async function getSchool(id: string): Promise<SchoolDetail | null> {
  try {
    return await adminApi<SchoolDetail>(`/schools/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

export function getAccountAvailability(email: string, excludeId?: string) {
  const query = new URLSearchParams({ email });
  if (excludeId) query.set("excludeId", excludeId);
  return adminApi<{ emailTaken: boolean }>(`/schools/account-availability?${query}`);
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
