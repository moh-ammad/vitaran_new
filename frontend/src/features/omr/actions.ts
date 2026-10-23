"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/services/api-client";
import { getOmScanTarget, scanTeacherOmr, setOmResultRelease } from "@/services/om-scans";
import type { OmResultRelease, OmScanResult, OmScanTarget } from "@/types/om-scan";

export async function scanOmrAction(formData: FormData): Promise<OmScanResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Attach an OMR sheet image");
  }
  const identity = {
    rollNo: String(formData.get("rollNo") ?? "").trim(),
    testId: String(formData.get("testId") ?? "").trim(),
    examDate: String(formData.get("examDate") ?? "").trim(),
  };
  if (!identity.rollNo || !identity.testId || !identity.examDate) {
    throw new Error("Enter roll no, test ID and exam date first");
  }
  try {
    const result = await scanTeacherOmr(file, identity);
    revalidatePath("/teacher/omr-scan");
    revalidatePath("/teacher/results");
    revalidatePath("/school/results");
    revalidatePath("/student/results");
    revalidatePath("/admin/results");
    return result;
  } catch (error) {
    throw new Error(error instanceof ApiError ? error.message : "Scan failed");
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
    revalidatePath("/student", "layout");
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
