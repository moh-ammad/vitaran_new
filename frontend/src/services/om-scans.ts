import "server-only";
import { ApiError } from "@/services/api-client";
import { studentApi } from "@/services/student-api";
import { teacherApi } from "@/services/teacher-api";
import type { OmResultRelease, OmScan, OmScanIdentity, OmScanResult, OmScanTarget } from "@/types/om-scan";

export function scanTeacherOmr(file: File, identity: OmScanIdentity) {
  const body = new FormData();
  body.append("rollNo", identity.rollNo);
  body.append("testId", identity.testId);
  body.append("examDate", identity.examDate);
  body.append("file", file);
  return teacherApi<OmScanResult>("/teacher/omr-scans", { method: "POST", body });
}

export function getOmScanTarget(rollNo: string, testId: string) {
  const query = new URLSearchParams({ rollNo, testId });
  return teacherApi<OmScanTarget>(`/teacher/omr-scans/target?${query}`);
}

export function listOmResultReleases() {
  return teacherApi<OmResultRelease[]>("/teacher/omr-scans/releases");
}

export function setOmResultRelease(input: {
  testId: string;
  programId: string;
  classLevel: number;
  sectionId: string | null;
  published: boolean;
}) {
  return teacherApi<OmResultRelease | null>("/teacher/omr-scans/releases", { method: "PUT", body: input });
}

export function listTeacherOmScans(testId?: string) {
  const query = testId ? `?testId=${encodeURIComponent(testId)}` : "";
  return teacherApi<OmScan[]>(`/teacher/omr-scans${query}`);
}

export function getTeacherOmScan(id: string) {
  return teacherApi<OmScan>(`/teacher/omr-scans/${encodeURIComponent(id)}`);
}

export async function listStudentOmScans() {
  try {
    return await studentApi<OmScan[]>("/student/omr-scans");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}

export async function getStudentOmScanReview(testId: string) {
  try {
    return await studentApi<OmScan>(`/student/omr-scans/${encodeURIComponent(testId)}/review`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
