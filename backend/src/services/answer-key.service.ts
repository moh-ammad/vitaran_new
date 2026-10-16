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
import { notifyContentChanged } from "../utils/content-events.js";
import { readPdf, requirePdf, toPdfData } from "../utils/pdf.js";
import { answerKeyAccessFilter, type ContentActor } from "./content-access.js";
import { toSchoolRef, type SchoolAccountDto } from "./school.service.js";

const KIND = "answer-keys";

function toAnswerKeyDto({ school, createdAt, updatedAt, publishedAt, programCode, ...rest }: AnswerKeySummary) {
  return {
    ...rest,
    program: programCode,
    programCode,
    school: school && toSchoolRef(school),
    publishedAt: publishedAt?.toISOString() ?? null,
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
function schoolAccessFilter(
  school: Pick<SchoolAccountDto, "id" | "type" | "programCodes">,
): Prisma.AnswerKeyWhereInput {
  return {
    programCode: { in: school.programCodes },
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
    where.push(schoolAccessFilter({
      id: school.id,
      type: school.type,
      programCodes: school.schoolPrograms.map((row) => row.program.code),
    }));
  }
  return (await answerKeyRepository.findRecentAnswerKeys({ AND: where }, limit)).map(toAnswerKeyDto);
}

export async function getAnswerKeyStats() {
  const [total, published] = await Promise.all([
    answerKeyRepository.countAnswerKeys(),
    answerKeyRepository.countAnswerKeys({ published: true }),
  ]);
  return { total, published };
}

export async function getAnswerKey(id: string) {
  const answerKey = await answerKeyRepository.findAnswerKeyById(id);
  if (!answerKey) throw new AppError(404, "Answer key not found");
  return toAnswerKeyDto(answerKey);
}

export async function uploadAnswerKey(
  { schoolId, fileName, program, ...meta }: UploadAnswerKeyQuery,
  body: unknown,
) {
  const pdf = requirePdf(body);

  return toAnswerKeyDto(
    await answerKeyRepository.createAnswerKey({
      ...meta,
      programCode: program,
      schoolId: await resolveSchoolId(meta.type, schoolId),
      ...toPdfData(pdf, fileName ?? "answer-key.pdf"),
    }),
  );
}

export async function updateAnswerKey(
  id: string,
  { schoolId, fileName, program, ...meta }: UpdateAnswerKeyQuery,
  body: unknown,
) {
  const pdf = readPdf(body);

  const answerKey = await answerKeyRepository.updateAnswerKey(id, {
    ...meta,
    programCode: program,
    schoolId: await resolveSchoolId(meta.type, schoolId),
    ...(pdf && toPdfData(pdf, fileName ?? "answer-key.pdf")),
  });
  // The key may have moved to another school, so tell every school.
  if (answerKey.published) notifyContentChanged({ kind: KIND, schoolId: null });
  return toAnswerKeyDto(answerKey);
}

function toContentActor(actor?: ContentActor | SchoolAccountDto): ContentActor | undefined {
  if (!actor) return undefined;
  if ("kind" in actor) return actor;
  return { kind: "school", school: actor };
}

export async function getAnswerKeyFile(id: string, actor?: ContentActor | SchoolAccountDto) {
  const contentActor = toContentActor(actor);
  const file = await answerKeyRepository.findAnswerKeyFile({
    id,
    ...(contentActor && answerKeyAccessFilter(contentActor)),
  });
  if (!file) throw new AppError(404, "Answer key not found");
  return file;
}

export async function listVisibleAnswerKeys(actor: ContentActor) {
  return (await answerKeyRepository.findAnswerKeys(answerKeyAccessFilter(actor))).map(toAnswerKeyDto);
}

export async function countVisibleAnswerKeys(actor: ContentActor) {
  return answerKeyRepository.countAnswerKeys(answerKeyAccessFilter(actor));
}

/** @deprecated Prefer listVisibleAnswerKeys with a ContentActor. */
export async function listSchoolAnswerKeys(school: SchoolAccountDto) {
  return listVisibleAnswerKeys({ kind: "school", school });
}

export async function setAnswerKeyPublished(id: string, published: boolean) {
  const answerKey = await answerKeyRepository.setAnswerKeyPublished(id, published);
  if (!answerKey) throw new AppError(404, "Answer key not found");
  notifyContentChanged({ kind: KIND, schoolId: answerKey.school?.id ?? null });
  return toAnswerKeyDto(answerKey);
}

export async function deleteAnswerKey(id: string) {
  const { schoolId, published } = await answerKeyRepository.deleteAnswerKey(id);
  if (published) notifyContentChanged({ kind: KIND, schoolId });
}
