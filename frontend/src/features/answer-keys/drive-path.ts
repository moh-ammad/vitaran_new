import type { SchoolType } from "@/types/school";

export type DrivePath = {
  /** Regular catalog program folder. */
  program?: string;
  /** Customized school folder. */
  schoolId?: string;
  testNumber?: number;
  /** Class row within a test (upload target). */
  classLevel?: number;
};

export type DriveSchool = {
  id: string;
  name: string;
  code: string;
  type: SchoolType;
  programs?: string[];
};

export const DRIVE_TESTS = Array.from({ length: 30 }, (_, index) => index + 1);
export const DRIVE_CLASSES = Array.from({ length: 10 }, (_, index) => index + 1);
