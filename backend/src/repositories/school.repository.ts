import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import {
  SchoolStatus,
  SchoolType,
  type SchoolBoard,
} from "../generated/prisma/enums.js";
import type { ListSchoolsQuery, SchoolProgramInput } from "../schemas/school.schema.js";

const RECENT_SCHOOLS_LIMIT = 5;
const SCHOOL_OPTIONS_LIMIT = 200;

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

/** Table / dashboard rows — no programs, address, or credentials. */
export const schoolSummarySelect = {
  id: true,
  code: true,
  name: true,
  board: true,
  type: true,
  status: true,
  contactName: true,
  contactEmail: true,
  city: true,
  state: true,
  createdAt: true,
} satisfies Prisma.SchoolSelect;

export type SchoolSummaryRow = Prisma.SchoolGetPayload<{ select: typeof schoolSummarySelect }>;

/** Picker rows — program codes and class levels only. */
export const schoolOptionSelect = {
  id: true,
  name: true,
  code: true,
  type: true,
  schoolPrograms: {
    orderBy: { program: { name: "asc" } },
    select: {
      program: { select: { code: true, name: true } },
      classes: { orderBy: { classLevel: "asc" }, select: { classLevel: true } },
    },
  },
} satisfies Prisma.SchoolSelect;

export type SchoolOptionRow = Prisma.SchoolGetPayload<{ select: typeof schoolOptionSelect }>;

/** Session / JWT — offerings for RBAC and forms, no address or credentials. */
export const schoolSessionSelect = {
  id: true,
  code: true,
  name: true,
  board: true,
  type: true,
  status: true,
  accountEmail: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  schoolPrograms: {
    orderBy: { program: { name: "asc" } },
    select: {
      programId: true,
      negativeMarking: true,
      program: {
        select: {
          code: true,
          name: true,
          year: true,
          classFrom: true,
          classTo: true,
          subjects: true,
        },
      },
      classes: { orderBy: { classLevel: "asc" }, select: { classLevel: true, subjects: true } },
    },
  },
} satisfies Prisma.SchoolSelect;

export type SchoolSessionRow = Prisma.SchoolGetPayload<{ select: typeof schoolSessionSelect }>;

export function findSchoolProgramMarking(schoolId: string, programId: string) {
  return prisma.schoolProgram.findUnique({
    where: { schoolId_programId: { schoolId, programId } },
    select: { negativeMarking: true },
  });
}

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
      select: schoolSummarySelect,
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

export function findSchoolSessionById(id: string) {
  return prisma.school.findUnique({ where: { id }, select: schoolSessionSelect });
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

function classFingerprint(classes: { classLevel: number; subjects: string[] }[]) {
  return classes
    .map((row) => `${row.classLevel}:${[...row.subjects].sort().join(",")}`)
    .sort()
    .join("|");
}

const SCHOOL_WRITE_TX = { timeout: 30_000, maxWait: 10_000 };

/** Writes only what changed: every round trip to Neon costs ~100–300ms. */
async function replaceSchoolPrograms(
  tx: Prisma.TransactionClient,
  schoolId: string,
  programs: SchoolProgramInput[],
) {
  const keep = programs.map((row) => row.programId);
  await tx.schoolProgram.deleteMany({ where: { schoolId, programId: { notIn: keep } } });
  const existing = await tx.schoolProgram.findMany({
    where: { schoolId, programId: { in: keep } },
    select: {
      id: true,
      programId: true,
      negativeMarking: true,
      classes: { select: { classLevel: true, subjects: true } },
    },
  });
  const byProgram = new Map(existing.map((row) => [row.programId, row]));

  for (const row of programs) {
    const current = byProgram.get(row.programId);
    if (!current) {
      await tx.schoolProgram.create({
        data: {
          schoolId,
          programId: row.programId,
          negativeMarking: row.negativeMarking,
          classes: {
            createMany: {
              data: row.classes.map((cls) => ({ classLevel: cls.classLevel, subjects: cls.subjects })),
            },
          },
        },
      });
      continue;
    }

    if (current.negativeMarking !== row.negativeMarking) {
      await tx.schoolProgram.update({
        where: { id: current.id },
        data: { negativeMarking: row.negativeMarking },
      });
    }
    if (classFingerprint(current.classes) === classFingerprint(row.classes)) continue;

    await tx.schoolProgramClass.deleteMany({ where: { schoolProgramId: current.id } });
    if (row.classes.length > 0) {
      await tx.schoolProgramClass.createMany({
        data: row.classes.map((cls) => ({
          schoolProgramId: current.id,
          classLevel: cls.classLevel,
          subjects: cls.subjects,
        })),
      });
    }
  }
}

export async function createSchool(
  data: Prisma.SchoolCreateInput & { programs?: SchoolProgramInput[] },
) {
  const { programs = [], ...rest } = data as Prisma.SchoolCreateInput & {
    programs?: SchoolProgramInput[];
  };
  return prisma.$transaction(async (tx) => {
    const school = await tx.school.create({ data: rest });
    await replaceSchoolPrograms(tx, school.id, programs);
    return tx.school.findUniqueOrThrow({
      where: { id: school.id },
      include: schoolProgramInclude,
    });
  }, SCHOOL_WRITE_TX);
}

export async function updateSchool(
  id: string,
  data: Prisma.SchoolUpdateInput & { programs?: SchoolProgramInput[] },
) {
  const { programs, ...rest } = data as Prisma.SchoolUpdateInput & {
    programs?: SchoolProgramInput[];
  };

  return prisma.$transaction(async (tx) => {
    if (programs) await replaceSchoolPrograms(tx, id, programs);

    return tx.school.update({
      where: { id },
      data: rest,
      include: schoolProgramInclude,
    });
  }, SCHOOL_WRITE_TX);
}

export function deleteSchool(id: string) {
  return prisma.school.delete({ where: { id } });
}

export async function findSchoolOptions(query: { type?: SchoolType; status?: SchoolStatus }) {
  return prisma.school.findMany({
    where: {
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    },
    select: schoolOptionSelect,
    orderBy: { name: "asc" },
    take: SCHOOL_OPTIONS_LIMIT,
  });
}

export async function getSchoolStats() {
  const [catalog, total, active, customized, byBoard, programGroups, recent] = await Promise.all([
    prisma.learningProgram.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.school.count(),
    prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
    prisma.school.count({ where: { type: SchoolType.CUSTOMIZED } }),
    prisma.school.groupBy({
      by: ["board"],
      _count: { _all: true },
      orderBy: { _count: { board: "desc" } },
    }),
    prisma.schoolProgram.groupBy({
      by: ["programId"],
      _count: { _all: true },
    }),
    prisma.school.findMany({
      select: schoolSummarySelect,
      orderBy: { createdAt: "desc" },
      take: RECENT_SCHOOLS_LIMIT,
    }),
  ]);

  const enrolledByProgramId = Object.fromEntries(
    programGroups.map((row) => [row.programId, row._count._all]),
  );

  return {
    total,
    active,
    customized,
    regular: total - customized,
    byBoard: byBoard.map((row) => ({
      board: row.board as SchoolBoard,
      count: row._count._all,
    })),
    byProgram: catalog.map((program) => ({
      program: program.code,
      programName: program.name,
      count: enrolledByProgramId[program.id] ?? 0,
    })),
    recent,
  };
}
