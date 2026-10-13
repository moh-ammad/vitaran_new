import type { Prisma } from "../generated/prisma/client.js";
import { SchoolType } from "../generated/prisma/enums.js";
import * as answerKeyRepository from "../repositories/answer-key.repository.js";
import type { AnswerKeySummary } from "../repositories/answer-key.repository.js";
import * as schoolRepository from "../repositories/school.repository.js";
import type {
  UpdateAnswerKeyQuery,
  UploadAnswerKeyQuery,
} from "../schemas/answer-key.schema.js";
import { AppError } from "../utils/app-error.js";
import { formatSchoolCode, type SchoolAccountDto } from "./school.service.js";

const PDF_SIGNATURE = Buffer.from("%PDF-");

function toAnswerKeyDto({ school, createdAt, updatedAt, ...rest }: AnswerKeySummary) {
  return {
    ...rest,
    school: school && { id: school.id, name: school.name, code: formatSchoolCode(school.serial) },
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

/** Express leaves the body empty when no PDF was sent. */
function readPdf(body: unknown): Buffer | null {
  if (!Buffer.isBuffer(body) || body.length === 0) return null;
  if (!body.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
    throw new AppError(400, "Only PDF files can be uploaded", [
      { path: ["file"], message: "Only PDF files can be uploaded" },
    ]);
  }
  return body;
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

export async function listRecentAnswerKeys(limit: number) {
  return (await answerKeyRepository.findRecentAnswerKeys(limit)).map(toAnswerKeyDto);
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
  { schoolId, ...meta }: UploadAnswerKeyQuery,
  body: unknown,
) {
  const pdf = readPdf(body);
  if (!pdf) {
    throw new AppError(400, "Attach a PDF file", [{ path: ["file"], message: "Attach a PDF file" }]);
  }

  return toAnswerKeyDto(
    await answerKeyRepository.createAnswerKey({
      ...meta,
      schoolId: await resolveSchoolId(meta.type, schoolId),
      fileSize: pdf.length,
      data: new Uint8Array(pdf),
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
      ...(pdf && {
        fileName: fileName ?? "answer-key.pdf",
        fileSize: pdf.length,
        data: new Uint8Array(pdf),
      }),
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

/**
 * Regular schools get the regular keys for their programs; customized schools get only
 * the keys uploaded for them.
 */
function schoolAccessFilter(school: SchoolAccountDto): Prisma.AnswerKeyWhereInput {
  return {
    program: { in: school.programs },
    ...(school.type === SchoolType.CUSTOMIZED
      ? { schoolId: school.id }
      : { type: SchoolType.REGULAR }),
  };
}

export async function listSchoolAnswerKeys(school: SchoolAccountDto) {
  return (await answerKeyRepository.findAnswerKeys(schoolAccessFilter(school))).map(toAnswerKeyDto);
}

export async function deleteAnswerKey(id: string) {
  await answerKeyRepository.deleteAnswerKey(id);
}
