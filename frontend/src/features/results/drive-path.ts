import type { SchoolType } from "@/types/school";

export type DrivePath = {
  /** Regular catalog program folder. */
  program?: string;
  /** School folder (customized from root, or regular under a program). */
  schoolId?: string;
  testNumber?: number;
  classLevel?: number;
};

export type DriveSchool = {
  id: string;
  name: string;
  code: string;
  type: SchoolType;
  programs?: string[];
  programLabels?: Record<string, string>;
  offerings?: Array<{ code: string; name: string; classLevels: number[] }>;
};

export const DRIVE_TESTS = Array.from({ length: 30 }, (_, index) => index + 1);
export const DRIVE_CLASSES = Array.from({ length: 10 }, (_, index) => index + 1);
