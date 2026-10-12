import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import {
  Program,
  SchoolStatus,
  type SchoolBoard,
} from "../generated/prisma/enums.js";
import type { ListSchoolsQuery } from "../schemas/school.schema.js";

const SCHOOL_CODE_PATTERN = /^VLS-?(\d{1,9})$/i;
const RECENT_SCHOOLS_LIMIT = 5;

function buildWhere(query: ListSchoolsQuery): Prisma.SchoolWhereInput {
  const where: Prisma.SchoolWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.board) where.board = query.board;

  if (query.search) {
    const codeMatch = SCHOOL_CODE_PATTERN.exec(query.search);
    const contains = { contains: query.search, mode: "insensitive" } as const;

    where.OR = [
      { name: contains },
      { city: contains },
      { state: contains },
      { contactName: contains },
      { contactEmail: contains },
      ...(codeMatch ? [{ serial: Number(codeMatch[1]) }] : []),
    ];
  }

  return where;
}

export async function findSchools(query: ListSchoolsQuery) {
  const where = buildWhere(query);

  const [items, total] = await prisma.$transaction([
    prisma.school.findMany({
      where,
      orderBy: [{ [query.sortBy]: query.sortOrder }, { serial: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.school.count({ where }),
  ]);

  return { items, total };
}

export function findSchoolById(id: string) {
  return prisma.school.findUnique({ where: { id } });
}

export function findSchoolByAccount(account: { email?: string; phone?: string }) {
  return prisma.school.findFirst({
    where: account.email
      ? { accountEmail: { equals: account.email, mode: "insensitive" } }
      : { accountPhone: account.phone },
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

export function createSchool(data: Prisma.SchoolCreateInput) {
  return prisma.school.create({ data });
}

export function updateSchool(id: string, data: Prisma.SchoolUpdateInput) {
  return prisma.school.update({ where: { id }, data });
}

export function deleteSchool(id: string) {
  return prisma.school.delete({ where: { id } });
}

export async function getSchoolStats() {
  const programs = Object.values(Program);

  const [total, active, byBoard, programCounts, recent] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
    prisma.school.groupBy({
      by: ["board"],
      _count: { _all: true },
      orderBy: { _count: { board: "desc" } },
    }),
    Promise.all(
      programs.map((program) =>
        prisma.school.count({ where: { programs: { has: program } } }),
      ),
    ),
    prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_SCHOOLS_LIMIT,
    }),
  ]);

  return {
    total,
    active,
    byBoard: byBoard.map((row) => ({
      board: row.board as SchoolBoard,
      count: row._count._all,
    })),
    byProgram: programs.map((program, index) => ({
      program,
      count: programCounts[index] ?? 0,
    })),
    recent,
  };
}
