import type { SchoolType, Subject } from "./school";
import type { SchoolProgramOffering } from "./program";

export const TEACHER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type TeacherStatus = (typeof TEACHER_STATUSES)[number];

export type TeacherAssignment = {
  programId: string;
  programCode: string;
  programName: string;
  classLevel: number;
  subject: Subject;
};

export type TeacherSchoolRef = {
  id: string;
  name: string;
  code: string;
  type: SchoolType;
};

export type Teacher = {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  status: TeacherStatus;
  assignments: TeacherAssignment[];
  school: TeacherSchoolRef;
  createdAt: string;
  updatedAt: string;
};

export type TeacherDetail = Teacher & { password: string };

export type TeacherAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: TeacherStatus;
  schoolId: string;
  assignments: TeacherAssignment[];
  school: {
    id: string;
    name: string;
    code: string;
    type: SchoolType;
    schoolPrograms: SchoolProgramOffering[];
    programCodes: string[];
  };
};

export type TeacherAssignmentInput = {
  programId: string;
  classLevel: number;
  subject: Subject;
};

export type ClassTeacherSlotInput = {
  programId: string;
  classLevel: number;
};

export type TeacherInput = {
  name: string;
  email: string;
  phone: string;
  status: TeacherStatus;
  assignments: TeacherAssignmentInput[];
  /** Program+class slots where this teacher is the class teacher. */
  classTeacherFor?: ClassTeacherSlotInput[];
  password?: string;
};

export type ClassTeacherSlot = {
  programId: string;
  programCode: string;
  programName: string;
  classLevel: number;
  teacherId: string;
  teacherName: string;
};

export type SchoolClassRow = {
  programId: string;
  programCode: string;
  programName: string;
  year: number;
  classLevel: number;
  subjects: Subject[];
  classTeacher: ClassTeacherRow | null;
};

export type TeacherList = {
  items: Teacher[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type SchoolDashboardStats = {
  teachers: { total: number; active: number };
  answerKeys: number;
  results: number;
  programs: number;
  subjects: number;
};

export type ClassTeacherRow = {
  id: string;
  teacherId: string;
  name: string;
  email: string;
  status: TeacherStatus;
};
