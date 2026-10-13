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
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, name: true, serial: true } },
} satisfies Prisma.AnswerKeySelect;

export type AnswerKeySummary = Prisma.AnswerKeyGetPayload<{
  select: typeof answerKeySummarySelect;
}>;

export function findRecentAnswerKeys(limit: number) {
  return prisma.answerKey.findMany({
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

export function countAnswerKeys() {
  return prisma.answerKey.count();
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

export function deleteAnswerKey(id: string) {
  return prisma.answerKey.delete({ where: { id } });
}
