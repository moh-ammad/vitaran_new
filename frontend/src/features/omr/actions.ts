"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/services/api-client";
import { getOmScanTarget, scanTeacherOmr, setOmResultRelease } from "@/services/om-scans";
import type { OmResultRelease, OmScanResult, OmScanTarget } from "@/types/om-scan";

export async function scanOmrAction(
  formData: FormData,
): Promise<{ ok: true; result: OmScanResult } | { ok: false; message: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Attach an OMR sheet image" };
  }
  const identity = {
    rollNo: String(formData.get("rollNo") ?? "").trim(),
    testId: String(formData.get("testId") ?? "").trim(),
    examDate: String(formData.get("examDate") ?? "").trim(),
  };
  if (!identity.rollNo || !identity.testId || !identity.examDate) {
    return { ok: false, message: "Enter roll no, test ID and exam date first" };
  }
  try {
    const result = await scanTeacherOmr(file, identity);
    revalidatePath("/teacher/omr-scan");
    revalidatePath("/teacher/results");
    revalidatePath("/teacher/analysis");
    revalidatePath("/school/results");
    revalidatePath("/school/analysis");
    revalidatePath("/student/results");
    revalidatePath("/admin/results");
    revalidatePath("/admin/analysis");
    return { ok: true, result };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function setOmResultReleaseAction(input: {
  testId: string;
  programId: string;
  classLevel: number;
  sectionId: string | null;
  published: boolean;
}): Promise<{ ok: true; release: OmResultRelease | null } | { ok: false; message: string }> {
  try {
    const release = await setOmResultRelease(input);
    revalidatePath("/teacher/omr-scan");
    revalidatePath("/teacher/analysis");
    revalidatePath("/student", "layout");
    revalidatePath("/school/analysis");
    revalidatePath("/admin/analysis");
    return { ok: true, release };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.message : "Could not update publishing" };
  }
}

export async function omScanTargetAction(
  rollNo: string,
  testId: string,
): Promise<{ ok: true; target: OmScanTarget } | { ok: false; message: string }> {
  try {
    return { ok: true, target: await getOmScanTarget(rollNo.trim(), testId.trim()) };
  } catch (error) {
    return { ok: false, message: error instanceof ApiError ? error.message : "Could not check roll no and test ID" };
  }
}
