import { prisma } from "../config/database.js";
import type { Prisma, Subject } from "../generated/prisma/client.js";
import {
  SchoolStatus,
  SchoolType,
  type SchoolBoard,
} from "../generated/prisma/enums.js";
import type { ListSchoolsQuery, SchoolProgramInput } from "../schemas/school.schema.js";

const RECENT_SCHOOLS_LIMIT = 5;

export const schoolProgramInclude = {
  schoolPrograms: {
    include: {
      program: true,
      classes: { orderBy: { classLevel: "asc" } },
    },
    orderBy: { program: { name: "asc" } },
  },
} satisfies Prisma.SchoolInclude;

export type SchoolWithPrograms = Prisma.SchoolGetPayload<{ include: typeof schoolProgramInclude }>;

function buildWhere(query: ListSchoolsQuery): Prisma.SchoolWhereInput {
  const where: Prisma.SchoolWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.board) where.board = query.board;
  if (query.type) where.type = query.type;

  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" } as const;

    where.OR = [
      { name: contains },
      { code: contains },
      { city: contains },
      { state: contains },
      { contactName: contains },
      { contactEmail: contains },
    ];
  }

  return where;
}

export async function findSchools(query: ListSchoolsQuery) {
  const where = buildWhere(query);

  const [items, total] = await prisma.$transaction([
    prisma.school.findMany({
      where,
      include: schoolProgramInclude,
      orderBy: [{ [query.sortBy]: query.sortOrder }, { serial: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.school.count({ where }),
  ]);

  return { items, total };
}

export function findSchoolById(id: string) {
  return prisma.school.findUnique({ where: { id }, include: schoolProgramInclude });
}

export function findSchoolByCode(code: string, excludeId?: string) {
  return prisma.school.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    select: { id: true },
  });
}

export function findSchoolByAccount(account: { email?: string; phone?: string }) {
  return prisma.school.findFirst({
    where: account.email
      ? { accountEmail: { equals: account.email, mode: "insensitive" } }
      : { accountPhone: account.phone },
    include: schoolProgramInclude,
  });
}

/** An email belongs to one school, whether as its login or its contact email. */
export async function isEmailUsedByOtherSchool(email: string, excludeId?: string) {
  const match = { equals: email, mode: "insensitive" } as const;
  const count = await prisma.school.count({
    where: {
      OR: [{ accountEmail: match }, { contactEmail: match }],
      ...(excludeId && { NOT: { id: excludeId } }),
    },
  });
  return count > 0;
}

export function findAccountConflicts(
  account: { accountEmail?: string; accountPhone?: string },
  excludeId?: string,
) {
  const conditions: Prisma.SchoolWhereInput[] = [];
  if (account.accountEmail) conditions.push({ accountEmail: account.accountEmail });
  if (account.accountPhone) conditions.push({ accountPhone: account.accountPhone });
  if (conditions.length === 0) return Promise.resolve([]);

  return prisma.school.findMany({
    where: { OR: conditions, ...(excludeId && { NOT: { id: excludeId } }) },
    select: { accountEmail: true, accountPhone: true },
  });
}

function programNestedCreate(programs: SchoolProgramInput[]) {
  return {
    create: programs.map((row) => ({
      programId: row.programId,
      classes: {
        create: row.classes.map((cls) => ({
          classLevel: cls.classLevel,
          subjects: cls.subjects as Subject[],
        })),
      },
    })),
  };
}

export function createSchool(
  data: Prisma.SchoolCreateInput & { programs?: SchoolProgramInput[] },
) {
  const { programs = [], ...rest } = data as Prisma.SchoolCreateInput & {
    programs?: SchoolProgramInput[];
  };
  return prisma.school.create({
    data: {
      ...rest,
      schoolPrograms: programNestedCreate(programs),
    },
    include: schoolProgramInclude,
  });
}

export async function updateSchool(
  id: string,
  data: Prisma.SchoolUpdateInput & { programs?: SchoolProgramInput[] },
) {
  const { programs, ...rest } = data as Prisma.SchoolUpdateInput & {
    programs?: SchoolProgramInput[];
  };

  return prisma.$transaction(async (tx) => {
    if (programs) {
      await tx.schoolProgram.deleteMany({ where: { schoolId: id } });
      for (const row of programs) {
        await tx.schoolProgram.create({
          data: {
            schoolId: id,
            programId: row.programId,
            classes: {
              create: row.classes.map((cls) => ({
                classLevel: cls.classLevel,
                subjects: cls.subjects as Subject[],
              })),
            },
          },
        });
      }
    }

    return tx.school.update({
      where: { id },
      data: rest,
      include: schoolProgramInclude,
    });
  });
}

export function deleteSchool(id: string) {
  return prisma.school.delete({ where: { id } });
}

export async function getSchoolStats() {
  const catalog = await prisma.learningProgram.findMany({ orderBy: { name: "asc" } });

  const [total, active, customized, byBoard, programCounts, recent] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
    prisma.school.count({ where: { type: SchoolType.CUSTOMIZED } }),
    prisma.school.groupBy({
      by: ["board"],
      _count: { _all: true },
      orderBy: { _count: { board: "desc" } },
    }),
    Promise.all(
      catalog.map((program) =>
        prisma.schoolProgram.count({ where: { programId: program.id } }),
      ),
    ),
    prisma.school.findMany({
      include: schoolProgramInclude,
      orderBy: { createdAt: "desc" },
      take: RECENT_SCHOOLS_LIMIT,
    }),
  ]);

  return {
    total,
    active,
    customized,
    regular: total - customized,
    byBoard: byBoard.map((row) => ({
      board: row.board as SchoolBoard,
      count: row._count._all,
    })),
    byProgram: catalog.map((program, index) => ({
      program: program.code,
      programName: program.name,
      count: programCounts[index] ?? 0,
    })),
    recent,
  };
}
