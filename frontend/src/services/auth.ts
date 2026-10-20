import "server-only";
import { apiClient } from "@/services/api-client";
import type {
  AdminLoginResult,
  AdminProfile,
  SchoolLoginResult,
  StudentLoginResult,
  TeacherLoginResult,
} from "@/types/auth";
import type { SchoolAccount } from "@/types/school";
import type { StudentAccount } from "@/types/student";
import type { TeacherAccount } from "@/types/teacher";

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export function loginAdmin(credentials: { email: string; password: string }) {
  return apiClient<AdminLoginResult>("/auth/login", {
    method: "POST",
    body: credentials,
    cache: "no-store",
  });
}

export async function fetchCurrentAdmin(token: string): Promise<AdminProfile> {
  const { admin } = await apiClient<{ admin: AdminProfile }>("/auth/me", {
    headers: authHeader(token),
    cache: "no-store",
  });
  return admin;
}

/** `identifier` is the school's login email or phone number. */
export function loginSchool(credentials: { identifier: string; password: string }) {
  return apiClient<SchoolLoginResult>("/auth/school/login", {
    method: "POST",
    body: credentials,
    cache: "no-store",
  });
}

export async function fetchCurrentSchool(token: string): Promise<SchoolAccount> {
  const { school } = await apiClient<{ school: SchoolAccount }>("/auth/school/me", {
    headers: authHeader(token),
    cache: "no-store",
  });
  return school;
}

/** `identifier` is the teacher's login email or phone number. */
export function loginTeacher(credentials: { identifier: string; password: string }) {
  return apiClient<TeacherLoginResult>("/auth/teacher/login", {
    method: "POST",
    body: credentials,
    cache: "no-store",
  });
}

export async function fetchCurrentTeacher(token: string): Promise<TeacherAccount> {
  const { teacher } = await apiClient<{ teacher: TeacherAccount }>("/auth/teacher/me", {
    headers: authHeader(token),
    cache: "no-store",
  });
  return teacher;
}

/** `identifier` is the student's roll number or parent/guardian email. */
export function loginStudent(credentials: { identifier: string; password: string }) {
  return apiClient<StudentLoginResult>("/auth/student/login", {
    method: "POST",
    body: credentials,
    cache: "no-store",
  });
}

export async function fetchCurrentStudent(token: string): Promise<StudentAccount> {
  const { student } = await apiClient<{ student: StudentAccount }>("/auth/student/me", {
    headers: authHeader(token),
    cache: "no-store",
  });
  return student;
}

export function requestForgotPasswordOtp(input: { email: string } | { rollNo: string }) {
  return apiClient<{
    ok: true;
    message: string;
    email: string;
    emailMasked: string;
    rollNo?: string;
  }>("/auth/forgot-password", {
    method: "POST",
    body: input,
  });
}

export function verifyForgotPasswordOtp(email: string, otp: string) {
  return apiClient<{ ok: true; role: "school" | "teacher" | "student"; message: string }>(
    "/auth/forgot-password/verify",
    {
      method: "POST",
      body: { email, otp },
    },
  );
}
