import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { SchoolStatus, StudentStatus } from "../generated/prisma/enums.js";
import * as studentRepository from "../repositories/student.repository.js";
import type { StudentLoginInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toStudentAccountDto, type StudentAccountDto } from "./student.service.js";

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "vitaran-api";
const JWT_AUDIENCE = "vitaran-student";
const STUDENT_ROLE = "student";
const DAY_MS = 24 * 60 * 60 * 1000;

export type StudentLoginResult = {
  token: string;
  expiresAt: string;
  student: StudentAccountDto;
};

const dummyHash = hashPassword("vitaran-dummy-password");

function getSecret(): Uint8Array {
  if (!env.JWT_SECRET) {
    throw new AppError(503, "Student authentication is not configured", undefined, false);
  }
  return new TextEncoder().encode(env.JWT_SECRET);
}

function passwordVersion(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

async function resolveStudent(identifier: string) {
  const value = identifier.trim();
  if (value.includes("@")) {
    return studentRepository.findStudentByEmail(value.toLowerCase());
  }

  const matches = await studentRepository.findStudentsByRoll(value);
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new AppError(
      401,
      "This roll number is used at more than one school. Sign in with your parent/guardian email instead.",
    );
  }
  return matches[0] ?? null;
}

export async function loginStudent(input: StudentLoginInput): Promise<StudentLoginResult> {
  const secret = getSecret();
  let student;
  try {
    student = await resolveStudent(input.identifier);
  } catch (error) {
    if (error instanceof AppError) throw error;
    student = null;
  }

  const passwordMatches = await verifyPassword(
    input.password,
    student?.passwordHash ?? (await dummyHash),
  );

  if (!student?.passwordHash || !passwordMatches) {
    throw new AppError(401, "Invalid roll number, email or password");
  }

  return issueStudentLogin(student, secret);
}

type StudentRecord = NonNullable<Awaited<ReturnType<typeof studentRepository.findStudentById>>>;

/** Password or Google — same JWT. Caller already proved the account. */
export async function issueStudentLogin(
  student: StudentRecord,
  secret = getSecret(),
): Promise<StudentLoginResult> {
  if (student.status !== StudentStatus.ACTIVE) {
    throw new AppError(403, "This student account is inactive");
  }
  if (student.school.status !== SchoolStatus.ACTIVE) {
    throw new AppError(403, "This school account is inactive");
  }
  if (!student.passwordHash) {
    throw new AppError(401, "Invalid roll number, email or password");
  }

  const expiresAt = new Date(Date.now() + env.SCHOOL_JWT_EXPIRES_IN_DAYS * DAY_MS);

  const token = await new SignJWT({
    role: STUDENT_ROLE,
    schoolId: student.schoolId,
    pwv: passwordVersion(student.passwordHash),
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(student.id)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    student: toStudentAccountDto(student),
  };
}

export async function verifyStudentToken(token: string): Promise<StudentAccountDto> {
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.role !== STUDENT_ROLE || !payload.sub) {
      throw new Error("Not a student token");
    }

    const student = await studentRepository.findStudentById(payload.sub);

    if (
      !student?.passwordHash ||
      student.status !== StudentStatus.ACTIVE ||
      student.school.status !== SchoolStatus.ACTIVE ||
      payload.pwv !== passwordVersion(student.passwordHash)
    ) {
      throw new Error("Student session revoked");
    }

    return toStudentAccountDto(student);
  } catch (_error) {
    throw new AppError(401, "Invalid or expired session");
  }
}
