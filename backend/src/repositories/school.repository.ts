import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import {
  Program,
  SchoolStatus,
  type SchoolBoard,
} from "../generated/prisma/enums.js";
import type {
  CreateSchoolInput,
  ListSchoolsQuery,
  UpdateSchoolInput,
} from "../schemas/school.schema.js";

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

export function createSchool(data: CreateSchoolInput) {
  return prisma.school.create({ data });
}

export function updateSchool(id: string, data: UpdateSchoolInput) {
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
