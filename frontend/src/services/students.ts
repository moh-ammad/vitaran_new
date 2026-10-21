import "server-only";
import { ApiError } from "@/services/api-client";
import { adminApi } from "@/services/admin-api";
import { schoolApi } from "@/services/school-api";
import { teacherApi } from "@/services/teacher-api";
import type {
  CreateStudentInput,
  Student,
  StudentDetail,
  StudentListResult,
  UpdateStudentInput,
} from "@/types/student";

type ListParams = {
  schoolId?: string;
  programId?: string;
  classLevel?: number;
  sectionId?: string;
  wholeClass?: boolean;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

function queryString(params: ListParams = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listSchoolStudents(params?: ListParams) {
  return schoolApi<StudentListResult>(`/school/students${queryString(params)}`);
}

export type SchoolStudentCounts = {
  byProgram: Record<string, number>;
  byClass: { programId: string; classLevel: number; count: number }[];
  bySection: Record<string, number>;
  byWhole: { programId: string; classLevel: number; count: number }[];
};

export function getSchoolStudentCounts() {
  return schoolApi<SchoolStudentCounts>("/school/students/counts");
}

export function getAdminSchoolStudentCounts(schoolId: string) {
  return adminApi<SchoolStudentCounts>(
    `/schools/${encodeURIComponent(schoolId)}/students/counts`,
  );
}

export async function getSchoolStudent(id: string): Promise<StudentDetail | null> {
  try {
    return await schoolApi<StudentDetail>(`/school/students/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export function createSchoolStudent(input: CreateStudentInput) {
  return schoolApi<StudentDetail>("/school/students", { method: "POST", body: input });
}

export function updateSchoolStudent(id: string, input: UpdateStudentInput) {
  return schoolApi<StudentDetail>(`/school/students/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteSchoolStudent(id: string) {
  return schoolApi<{ ok: true }>(`/school/students/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function sendSchoolStudentCredentials(id: string) {
  return schoolApi<{ ok: true }>(`/school/students/${encodeURIComponent(id)}/send-credentials`, {
    method: "POST",
  });
}

export function resetSchoolStudentPassword(id: string, password: string) {
  return schoolApi<StudentDetail>(`/school/students/${encodeURIComponent(id)}/reset-password`, {
    method: "POST",
    body: { password },
  });
}

export function listAdminSchoolStudents(schoolId: string, params?: ListParams) {
  return adminApi<StudentListResult>(
    `/schools/${encodeURIComponent(schoolId)}/students${queryString(params)}`,
  );
}

export function listAdminStudents(params?: ListParams) {
  return adminApi<StudentListResult>(`/students${queryString(params)}`);
}

export async function getAdminSchoolStudent(
  schoolId: string,
  id: string,
): Promise<StudentDetail | null> {
  try {
    return await adminApi<StudentDetail>(
      `/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(id)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export function createAdminSchoolStudent(schoolId: string, input: CreateStudentInput) {
  return adminApi<StudentDetail>(`/schools/${encodeURIComponent(schoolId)}/students`, {
    method: "POST",
    body: input,
  });
}

export function updateAdminSchoolStudent(
  schoolId: string,
  id: string,
  input: UpdateStudentInput,
) {
  return adminApi<StudentDetail>(
    `/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
}

export function deleteAdminSchoolStudent(schoolId: string, id: string) {
  return adminApi<{ ok: true }>(
    `/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function getAdminStudent(id: string): Promise<StudentDetail | null> {
  try {
    return await adminApi<StudentDetail>(`/students/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export function updateAdminStudent(id: string, input: UpdateStudentInput) {
  return adminApi<StudentDetail>(`/students/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteAdminStudent(id: string) {
  return adminApi<{ ok: true }>(`/students/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function sendAdminStudentCredentials(id: string) {
  return adminApi<{ ok: true }>(`/students/${encodeURIComponent(id)}/send-credentials`, {
    method: "POST",
  });
}

export function resetAdminStudentPassword(id: string, password: string) {
  return adminApi<StudentDetail>(`/students/${encodeURIComponent(id)}/reset-password`, {
    method: "POST",
    body: { password },
  });
}

export function listTeacherStudents(params?: ListParams) {
  return teacherApi<StudentListResult>(`/teacher/students${queryString(params)}`);
}

export type { Student, StudentDetail };
