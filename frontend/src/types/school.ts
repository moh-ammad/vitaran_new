export const SCHOOL_BOARDS = [
  "CBSE",
  "ICSE",
  "STATE",
  "IB",
  "IGCSE",
  "OTHER",
] as const;

export const SCHOOL_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const PROGRAMS = [
  "INTEGRATED",
  "ADVANCED",
  "REVISED_ADVANCED",
  "OLYMPIAD",
  "OLYMPIAD_PRIMARY",
] as const;

export type SchoolBoard = (typeof SCHOOL_BOARDS)[number];
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];
export type Program = (typeof PROGRAMS)[number];

export type School = {
  id: string;
  code: string;
  name: string;
  board: SchoolBoard;
  status: SchoolStatus;
  programs: Program[];
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

/** What a signed-in school sees about itself; admin-only fields are left out. */
export type SchoolAccount = Omit<School, "notes">;

/** Admin detail view; `password` is null for schools created before it was stored. */
export type SchoolDetail = School & { password: string | null };

export type SchoolInput = Omit<
  School,
  "id" | "code" | "accountEmail" | "accountPhone" | "createdAt" | "updatedAt"
> & {
  accountEmail: string;
  accountPhone: string;
  /** Omitted on update to keep the current password. */
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
  byBoard: { board: SchoolBoard; count: number }[];
  byProgram: { program: Program; count: number }[];
  recent: School[];
};
