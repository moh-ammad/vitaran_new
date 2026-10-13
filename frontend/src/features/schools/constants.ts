import type { Program, SchoolBoard, SchoolStatus, SchoolType } from "@/types/school";

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

export const PROGRAM_LABELS: Record<Program, string> = {
  INTEGRATED: "Integrated Program",
  ADVANCED: "Advanced Program",
  REVISED_ADVANCED: "Revised Advanced Program",
  OLYMPIAD: "Olympiad Program",
  OLYMPIAD_PRIMARY: "Olympiad Program Class 1 to 5",
};

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
