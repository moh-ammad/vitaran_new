import type { SchoolProgramOffering } from "./program";

export const SCHOOL_BOARDS = [
  "CBSE",
  "ICSE",
  "STATE",
  "IB",
  "IGCSE",
  "OTHER",
] as const;

export const SCHOOL_TYPES = ["REGULAR", "CUSTOMIZED"] as const;

export const SCHOOL_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const SUBJECTS = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "SCIENCE"] as const;

/** @deprecated Prefer LearningProgram.code from the programs catalog. */
export const PROGRAMS = [
  "INTEGRATED",
  "ADVANCED",
  "REVISED_ADVANCED",
  "OLYMPIAD",
  "OLYMPIAD_PRIMARY",
] as const;

export const SUBJECTS = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "SCIENCE"] as const;

export type SchoolBoard = (typeof SCHOOL_BOARDS)[number];
export type SchoolType = (typeof SCHOOL_TYPES)[number];
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];
export type Subject = (typeof SUBJECTS)[number];
export type Program = (typeof PROGRAMS)[number] | string;

export type School = {
  id: string;
  code: string;
  name: string;
  board: SchoolBoard;
  type: SchoolType;
  status: SchoolStatus;
  schoolPrograms: SchoolProgramOffering[];
  programCodes: string[];
  principalName: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  studentStrength: number | null;
  notes: string | null;
  accountEmail: string | null;
  accountPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SchoolAccount = Omit<School, "notes">;

export type SchoolDetail = School & { password: string | null };

export type SchoolProgramInput = {
  programId: string;
  classes: { classLevel: number; subjects: Subject[] }[];
};

export type SchoolInput = Omit<
  School,
  | "id"
  | "accountEmail"
  | "accountPhone"
  | "createdAt"
  | "updatedAt"
  | "schoolPrograms"
  | "programCodes"
> & {
  /** School ID shown as VLS-XXXX (e.g. VLS-0018). */
  code: string;
  accountEmail: string;
  accountPhone: string;
  programs: SchoolProgramInput[];
  password?: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SchoolList = {
  items: School[];
  pagination: Pagination;
};

export type SchoolStats = {
  total: number;
  active: number;
  inactive: number;
  regular: number;
  customized: number;
  byBoard: { board: SchoolBoard; count: number }[];
  byProgram: { program: string; programName: string; count: number }[];
  recent: School[];
};
