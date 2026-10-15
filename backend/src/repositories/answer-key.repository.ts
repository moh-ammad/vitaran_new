import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";

/** Everything except the file bytes. */
export const answerKeySummarySelect = {
  id: true,
  program: true,
  type: true,
  testNumber: true,
  classLevel: true,
  fileName: true,
  fileSize: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, name: true, serial: true } },
} satisfies Prisma.AnswerKeySelect;

export type AnswerKeySummary = Prisma.AnswerKeyGetPayload<{
  select: typeof answerKeySummarySelect;
}>;

export function findRecentAnswerKeys(where: Prisma.AnswerKeyWhereInput, limit: number) {
  return prisma.answerKey.findMany({
    where,
    select: answerKeySummarySelect,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export function findAnswerKeys(where: Prisma.AnswerKeyWhereInput) {
  return prisma.answerKey.findMany({
    where,
    select: answerKeySummarySelect,
    orderBy: [{ classLevel: "asc" }, { testNumber: "asc" }],
  });
}

export function countAnswerKeys(where?: Prisma.AnswerKeyWhereInput) {
  return prisma.answerKey.count({ where });
}

export function findAnswerKeyById(id: string) {
  return prisma.answerKey.findUnique({ where: { id }, select: answerKeySummarySelect });
}

export function findAnswerKeyFile(where: Prisma.AnswerKeyWhereInput) {
  return prisma.answerKey.findFirst({
    where,
    select: { fileName: true, data: true },
  });
}

export function createAnswerKey(data: Prisma.AnswerKeyUncheckedCreateInput) {
  return prisma.answerKey.create({ data, select: answerKeySummarySelect });
}

export function updateAnswerKey(id: string, data: Prisma.AnswerKeyUncheckedUpdateInput) {
  return prisma.answerKey.update({ where: { id }, data, select: answerKeySummarySelect });
}

/** Publishing isn't an edit, so `updatedAt` is kept as it was. Returns null when the key is gone. */
export async function setAnswerKeyPublished(id: string, published: boolean) {
  const current = await prisma.answerKey.findUnique({ where: { id }, select: { updatedAt: true } });
  if (!current) return null;
  return prisma.answerKey.update({
    where: { id },
    data: { published, publishedAt: published ? new Date() : null, updatedAt: current.updatedAt },
    select: answerKeySummarySelect,
  });
}

export function deleteAnswerKey(id: string) {
  return prisma.answerKey.delete({ where: { id }, select: { schoolId: true, published: true } });
}
