import { createHash, randomInt } from "node:crypto";
import { PasswordResetRole } from "../generated/prisma/enums.js";
import { prisma } from "../config/database.js";
import * as schoolRepository from "../repositories/school.repository.js";
import * as studentRepository from "../repositories/student.repository.js";
import * as teacherRepository from "../repositories/teacher.repository.js";
import type { ForgotPasswordRequestInput } from "../schemas/auth.schema.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword } from "../utils/password.js";
import { encryptSecret } from "../utils/secret-box.js";
import {
  sendPasswordResetOtpEmail,
  sendSchoolCredentialsEmail,
  sendStudentCredentialsEmail,
  sendTeacherCredentialsEmail,
} from "./mail.service.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const UNKNOWN_PORTAL_EMAIL = "No school or teacher account uses that email.";
const UNKNOWN_ROLL = "No student account matches that roll number.";
const NO_STUDENT_EMAIL =
  "No parent/guardian email is on file for this roll number. Ask your school to add one or reset the password.";
const AMBIGUOUS_ROLL =
  "This roll number is used at more than one school. Ask your school to reset your password.";

function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateOtp() {
  return String(randomInt(100_000, 1_000_000));
}

function generatePassword() {
  const chunk = randomInt(0, 36 ** 4)
    .toString(36)
    .padStart(4, "0");
  const digits = String(randomInt(1000, 10_000));
  return `${chunk}${digits}`;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

async function sealPassword(password: string) {
  return {
    passwordHash: await hashPassword(password),
    passwordEncrypted: encryptSecret(password),
  };
}

type AccountTarget =
  | {
      role: typeof PasswordResetRole.SCHOOL;
      id: string;
      email: string;
      name: string;
      phone: string | null;
      brand: string;
    }
  | {
      role: typeof PasswordResetRole.TEACHER;
      id: string;
      email: string;
      name: string;
      phone: string | null;
      brand: string;
      schoolName: string;
      schoolEmail: string | null;
    }
  | {
      role: typeof PasswordResetRole.STUDENT;
      id: string;
      email: string;
      name: string;
      brand: string;
      schoolName: string;
      schoolEmail: string | null;
      schoolCode: string;
      rollNo: string;
    };

/** School / teacher portal — email must match a real school or teacher login. */
async function resolvePortalAccount(email: string): Promise<AccountTarget | null> {
  const normalized = email.trim().toLowerCase();
  const school = await schoolRepository.findSchoolByAccount({ email: normalized });
  if (school?.accountEmail && school.passwordHash) {
    return {
      role: PasswordResetRole.SCHOOL,
      id: school.id,
      email: school.accountEmail,
      name: school.name,
      phone: school.accountPhone,
      brand: "Vitaran Learning",
    };
  }

  const teacher = await teacherRepository.findTeacherByAccount({ email: normalized });
  if (teacher?.passwordHash) {
    return {
      role: PasswordResetRole.TEACHER,
      id: teacher.id,
      email: teacher.email,
      name: teacher.name,
      phone: teacher.phone,
      brand: teacher.school.name,
      schoolName: teacher.school.name,
      schoolEmail: teacher.school.accountEmail,
    };
  }

  return null;
}

/** Student portal — roll number looks up the parent/guardian email on file. */
async function resolveStudentByRoll(rollNo: string): Promise<AccountTarget> {
  const matches = await studentRepository.findStudentsByRoll(rollNo);
  if (matches.length === 0) {
    throw new AppError(404, UNKNOWN_ROLL, [{ path: ["rollNo"], message: UNKNOWN_ROLL }]);
  }
  if (matches.length > 1) {
    throw new AppError(400, AMBIGUOUS_ROLL, [{ path: ["rollNo"], message: AMBIGUOUS_ROLL }]);
  }

  const student = matches[0]!;
  if (!student.passwordHash) {
    throw new AppError(404, UNKNOWN_ROLL, [{ path: ["rollNo"], message: UNKNOWN_ROLL }]);
  }
  if (!student.email) {
    throw new AppError(400, NO_STUDENT_EMAIL, [{ path: ["rollNo"], message: NO_STUDENT_EMAIL }]);
  }

  return {
    role: PasswordResetRole.STUDENT,
    id: student.id,
    email: student.email,
    name: student.name,
    brand: student.school.name,
    schoolName: student.school.name,
    schoolEmail: student.school.accountEmail,
    schoolCode: student.school.code,
    rollNo: student.rollNo,
  };
}

async function issueOtp(account: AccountTarget) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.passwordResetOtp.updateMany({
    where: {
      email: account.email.toLowerCase(),
      role: account.role,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.passwordResetOtp.create({
    data: {
      role: account.role,
      accountId: account.id,
      email: account.email.toLowerCase(),
      codeHash: hashOtp(otp),
      expiresAt,
    },
  });

  const sent = await sendPasswordResetOtpEmail({
    to: account.email,
    brand: account.brand,
    fromName: account.brand,
    replyTo:
      account.role === PasswordResetRole.TEACHER || account.role === PasswordResetRole.STUDENT
        ? account.schoolEmail
        : null,
    otp,
    minutes: 10,
  });
  if (!sent) {
    throw new AppError(502, "Could not send the verification email. Please try again shortly.");
  }

  const masked = maskEmail(account.email);
  const message =
    account.role === PasswordResetRole.STUDENT
      ? `We sent a one-time code to the parent/guardian email on file for roll ${account.rollNo} (${masked}).`
      : `We sent a one-time verification code to ${masked}.`;

  return {
    ok: true as const,
    message,
    email: account.email.toLowerCase(),
    emailMasked: masked,
    ...(account.role === PasswordResetRole.STUDENT ? { rollNo: account.rollNo } : {}),
  };
}

/** Step 1 — send OTP only for a known portal email or student roll number. */
export async function requestPasswordResetOtp(input: ForgotPasswordRequestInput) {
  if (input.rollNo) {
    const account = await resolveStudentByRoll(input.rollNo);
    return issueOtp(account);
  }

  const account = await resolvePortalAccount(input.email!);
  if (!account) {
    throw new AppError(404, UNKNOWN_PORTAL_EMAIL, [
      { path: ["email"], message: UNKNOWN_PORTAL_EMAIL },
    ]);
  }

  return issueOtp(account);
}

/**
 * Step 2 — verify OTP, set a new random password, email it.
 * Admin (school) / school (teacher) detail views pick up the new password from storage.
 */
export async function verifyPasswordResetOtp(email: string, otp: string) {
  const normalized = email.trim().toLowerCase();
  const code = otp.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new AppError(400, "Enter the 6-digit code from your email", [
      { path: ["otp"], message: "Enter the 6-digit code from your email" },
    ]);
  }

  const row = await prisma.passwordResetOtp.findFirst({
    where: {
      email: normalized,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    throw new AppError(400, "Code expired or not found. Request a new one.", [
      { path: ["otp"], message: "Code expired or not found. Request a new one." },
    ]);
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await prisma.passwordResetOtp.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
    throw new AppError(400, "Too many attempts. Request a new code.", [
      { path: ["otp"], message: "Too many attempts. Request a new code." },
    ]);
  }

  if (row.codeHash !== hashOtp(code)) {
    await prisma.passwordResetOtp.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError(400, "Incorrect code. Try again.", [
      { path: ["otp"], message: "Incorrect code. Try again." },
    ]);
  }

  await prisma.passwordResetOtp.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });

  const password = generatePassword();
  const sealed = await sealPassword(password);

  if (row.role === PasswordResetRole.SCHOOL) {
    const school = await schoolRepository.findSchoolById(row.accountId);
    if (!school?.accountEmail) throw new AppError(404, "School not found");

    await schoolRepository.updateSchool(row.accountId, sealed);

    const sent = await sendSchoolCredentialsEmail({
      to: school.accountEmail,
      schoolName: school.name,
      loginEmail: school.accountEmail,
      loginPhone: school.accountPhone,
      password,
      reason: "password-reset",
    });
    if (!sent) {
      throw new AppError(
        502,
        "Password was reset but we could not email it. Ask your admin to use Send credentials.",
      );
    }

    return {
      ok: true as const,
      role: "school" as const,
      message: "Password updated. Check your email for the new password.",
    };
  }

  if (row.role === PasswordResetRole.STUDENT) {
    const student = await studentRepository.findStudentById(row.accountId);
    if (!student?.email) throw new AppError(404, "Student not found");

    await studentRepository.updateStudent(row.accountId, sealed);

    const sent = await sendStudentCredentialsEmail({
      to: student.email,
      studentName: student.name,
      schoolName: student.school.name,
      schoolEmail: student.school.accountEmail,
      schoolCode: student.school.code,
      rollNo: student.rollNo,
      password,
      reason: "password-reset",
    });
    if (!sent) {
      throw new AppError(
        502,
        "Password was reset but we could not email it. Ask your school for help.",
      );
    }

    return {
      ok: true as const,
      role: "student" as const,
      message:
        "Password updated. Check the parent/guardian email for the new password and roll number.",
    };
  }

  const teacher = await teacherRepository.findTeacherById(row.accountId);
  if (!teacher) throw new AppError(404, "Teacher not found");

  await teacherRepository.updateTeacher(row.accountId, sealed);

  const sent = await sendTeacherCredentialsEmail({
    to: teacher.email,
    teacherName: teacher.name,
    schoolName: teacher.school.name,
    schoolEmail: teacher.school.accountEmail,
    loginEmail: teacher.email,
    loginPhone: teacher.phone,
    password,
    reason: "password-reset",
  });
  if (!sent) {
    throw new AppError(
      502,
      "Password was reset but we could not email it. Ask your school to use Send credentials.",
    );
  }

  return {
    ok: true as const,
    role: "teacher" as const,
    message:
      "Password updated. Check your email for the new password — your school received a copy too.",
  };
}
