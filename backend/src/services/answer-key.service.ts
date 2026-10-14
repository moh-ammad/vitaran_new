import type { Prisma } from "../generated/prisma/client.js";
import { SchoolType } from "../generated/prisma/enums.js";
import * as answerKeyRepository from "../repositories/answer-key.repository.js";
import type { AnswerKeySummary } from "../repositories/answer-key.repository.js";
import * as schoolRepository from "../repositories/school.repository.js";
import type {
  ListAnswerKeysQuery,
  UpdateAnswerKeyQuery,
  UploadAnswerKeyQuery,
} from "../schemas/answer-key.schema.js";
import { AppError } from "../utils/app-error.js";
import { readPdf, requirePdf, toPdfData } from "../utils/pdf.js";
import { toSchoolRef, type SchoolAccountDto } from "./school.service.js";

function toAnswerKeyDto({ school, createdAt, updatedAt, ...rest }: AnswerKeySummary) {
  return {
    ...rest,
    school: school && toSchoolRef(school),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

/** Customized keys must point at a customized school; regular keys never have one. */
async function resolveSchoolId(type: SchoolType, schoolId?: string) {
  if (type === SchoolType.REGULAR) return null;

  const school = schoolId && (await schoolRepository.findSchoolById(schoolId));
  if (!school || school.type !== SchoolType.CUSTOMIZED) {
    throw new AppError(400, "Select a customized school", [
      { path: ["schoolId"], message: "Select a customized school" },
    ]);
  }
  return school.id;
}

/**
 * Regular schools get the regular keys for their programs; customized schools get only
 * the keys uploaded for them.
 */
/** The answer keys a school can open: its own if customized, otherwise the regular ones for its programs. */
function schoolAccessFilter(school: Pick<SchoolAccountDto, "id" | "type" | "programs">): Prisma.AnswerKeyWhereInput {
  return {
    program: { in: school.programs },
    ...(school.type === SchoolType.CUSTOMIZED
      ? { schoolId: school.id }
      : { type: SchoolType.REGULAR }),
  };
}

export async function listRecentAnswerKeys({ limit, testNumber, type, schoolId }: ListAnswerKeysQuery) {
  const where: Prisma.AnswerKeyWhereInput[] = [{ testNumber, type }];
  if (schoolId) {
    const school = await schoolRepository.findSchoolById(schoolId);
    if (!school) return [];
    where.push(schoolAccessFilter(school));
  }
  return (await answerKeyRepository.findRecentAnswerKeys({ AND: where }, limit)).map(toAnswerKeyDto);
}

export async function getAnswerKeyStats() {
  return { total: await answerKeyRepository.countAnswerKeys() };
}

export async function getAnswerKey(id: string) {
  const answerKey = await answerKeyRepository.findAnswerKeyById(id);
  if (!answerKey) throw new AppError(404, "Answer key not found");
  return toAnswerKeyDto(answerKey);
}

export async function uploadAnswerKey(
  { schoolId, fileName, ...meta }: UploadAnswerKeyQuery,
  body: unknown,
) {
  const pdf = requirePdf(body);

  return toAnswerKeyDto(
    await answerKeyRepository.createAnswerKey({
      ...meta,
      schoolId: await resolveSchoolId(meta.type, schoolId),
      ...toPdfData(pdf, fileName),
    }),
  );
}

export async function updateAnswerKey(
  id: string,
  { schoolId, fileName, ...meta }: UpdateAnswerKeyQuery,
  body: unknown,
) {
  const pdf = readPdf(body);

  return toAnswerKeyDto(
    await answerKeyRepository.updateAnswerKey(id, {
      ...meta,
      schoolId: await resolveSchoolId(meta.type, schoolId),
      ...(pdf && toPdfData(pdf, fileName ?? "answer-key.pdf")),
    }),
  );
}

export async function getAnswerKeyFile(id: string, school?: SchoolAccountDto) {
  const file = await answerKeyRepository.findAnswerKeyFile({
    id,
    ...(school && schoolAccessFilter(school)),
  });
  if (!file) throw new AppError(404, "Answer key not found");
  return file;
}

export async function listSchoolAnswerKeys(school: SchoolAccountDto) {
  return (await answerKeyRepository.findAnswerKeys(schoolAccessFilter(school))).map(toAnswerKeyDto);
}

export async function deleteAnswerKey(id: string) {
  await answerKeyRepository.deleteAnswerKey(id);
}
