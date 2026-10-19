import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { StudentStatus } from "../generated/prisma/enums.js";
import type { ListStudentsQuery } from "../schemas/student.schema.js";

export const studentInclude = {
  school: { select: { id: true, name: true, code: true, status: true, accountEmail: true } },
  program: { select: { id: true, code: true, name: true, year: true } },
  section: {
    select: {
      id: true,
      name: true,
      classLevel: true,
      programId: true,
      studentCount: true,
      classTeacherId: true,
    },
  },
} satisfies Prisma.StudentInclude;

export type StudentRecord = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

type ListFilter = ListStudentsQuery & { schoolId?: string };

function listWhere(query: ListFilter): Prisma.StudentWhereInput {
  const and: Prisma.StudentWhereInput[] = [];
  if (query.schoolId) and.push({ schoolId: query.schoolId });
  if (query.programId) and.push({ programId: query.programId });
  if (query.classLevel != null) and.push({ classLevel: query.classLevel });
  if (query.sectionId) and.push({ sectionId: query.sectionId });
  if (query.wholeClass === true) and.push({ sectionId: null });
  if (query.status) and.push({ status: query.status });
  if (query.q) {
    and.push({
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { rollNo: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export function findStudentById(id: string) {
  return prisma.student.findUnique({ where: { id }, include: studentInclude });
}

export function findStudentBySchoolAndRoll(schoolId: string, rollNo: string) {
  return prisma.student.findUnique({
    where: { schoolId_rollNo: { schoolId, rollNo } },
    include: studentInclude,
  });
}

export function findStudentBySchoolCodeAndRoll(schoolCode: string, rollNo: string) {
  return prisma.student.findFirst({
    where: {
      rollNo: { equals: rollNo, mode: "insensitive" },
      school: { code: { equals: schoolCode.trim().toUpperCase(), mode: "insensitive" } },
    },
    include: studentInclude,
  });
}

export function findStudentByEmail(email: string) {
  return prisma.student.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: studentInclude,
  });
}

export function findStudentsByRoll(rollNo: string) {
  return prisma.student.findMany({
    where: { rollNo: { equals: rollNo.trim(), mode: "insensitive" } },
    include: studentInclude,
    take: 5,
  });
}

export async function findStudents(query: ListFilter) {
  const where = listWhere(query);
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: [{ classLevel: "asc" }, { rollNo: "asc" }],
      skip,
      take: query.pageSize,
    }),
    prisma.student.count({ where }),
  ]);
  return { items, total };
}

export function countStudents(where: Prisma.StudentWhereInput) {
  return prisma.student.count({ where });
}

export function createStudent(data: {
  schoolId: string;
  name: string;
  rollNo: string;
  email: string | null;
  programId: string;
  classLevel: number;
  sectionId: string | null;
  status: StudentStatus;
  passwordHash: string;
  passwordEncrypted: string;
}) {
  return prisma.student.create({ data, include: studentInclude });
}

export function updateStudent(
  id: string,
  data: Prisma.StudentUpdateInput,
) {
  return prisma.student.update({ where: { id }, data, include: studentInclude });
}

export function deleteStudent(id: string) {
  return prisma.student.delete({ where: { id } });
}

export function isRollTaken(schoolId: string, rollNo: string, excludeId?: string) {
  return prisma.student.findFirst({
    where: {
      schoolId,
      rollNo: { equals: rollNo, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}

type TeacherScope =
  | { sectionId: string }
  | { programId: string; classLevel: number; sectionId: null }
  | { programId: string; classLevel: number };

export async function findStudentsForTeacher(
  schoolId: string,
  scopeOr: TeacherScope[],
  query: ListStudentsQuery,
) {
  const where: Prisma.StudentWhereInput = {
    schoolId,
    OR: scopeOr,
    ...(query.programId ? { programId: query.programId } : {}),
    ...(query.classLevel != null ? { classLevel: query.classLevel } : {}),
    ...(query.sectionId ? { sectionId: query.sectionId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          AND: [
            {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { rollNo: { contains: query.q, mode: "insensitive" } },
                { email: { contains: query.q, mode: "insensitive" } },
              ],
            },
          ],
        }
      : {}),
  };

  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: [{ classLevel: "asc" }, { rollNo: "asc" }],
      skip,
      take: query.pageSize,
    }),
    prisma.student.count({ where }),
  ]);
  return { items, total };
}
