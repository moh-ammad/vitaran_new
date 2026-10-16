import type { SchoolBoard, SchoolStatus, SchoolType, Subject } from "@/types/school";

export const BOARD_LABELS: Record<SchoolBoard, string> = {
  CBSE: "CBSE",
  ICSE: "ICSE",
  STATE: "State Board",
  IB: "IB",
  IGCSE: "IGCSE",
  OTHER: "Other",
};

export const TYPE_LABELS: Record<SchoolType, string> = {
  REGULAR: "Regular",
  CUSTOMIZED: "Customized",
};

export const STATUS_LABELS: Record<SchoolStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

/** Fallback labels for seeded catalog codes; prefer LearningProgram.name when available. */
export const PROGRAM_LABELS: Record<string, string> = {
  INTEGRATED: "Integrated Program",
  ADVANCED: "Advanced Program",
  REVISED_ADVANCED: "Revised Advanced Program",
  OLYMPIAD: "Olympiad Program",
  OLYMPIAD_PRIMARY: "Olympiad Program Class 1 to 5",
};

export function programLabel(code: string, name?: string | null) {
  return name?.trim() || PROGRAM_LABELS[code] || code.replaceAll("_", " ");
}

/** Also the `subject` names used by the solution books. */
export const SUBJECT_LABELS = {
  MATHEMATICS: "Mathematics",
  PHYSICS: "Physics",
  CHEMISTRY: "Chemistry",
  BIOLOGY: "Biology",
  SCIENCE: "Science",
} as const satisfies Record<Subject, string>;

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const SCHOOLS_PAGE_SIZE = 10;
