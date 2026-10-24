import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import * as schoolRepository from "../repositories/school.repository.js";
import * as studentRepository from "../repositories/student.repository.js";
import * as teacherRepository from "../repositories/teacher.repository.js";
import { AppError } from "../utils/app-error.js";
import { issueSchoolLogin, type SchoolLoginResult } from "./school-auth.service.js";
import { issueStudentLogin, type StudentLoginResult } from "./student-auth.service.js";
import { issueTeacherLogin, type TeacherLoginResult } from "./teacher-auth.service.js";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

const UNLINKED =
  "This Google account isn't registered on Vitaran. Use the school, teacher, or student email we issued.";

export type GooglePortal = "school" | "student";

export type GoogleLoginResult =
  | (SchoolLoginResult & { role: "school" })
  | (TeacherLoginResult & { role: "teacher" })
  | (StudentLoginResult & { role: "student" });

function emailVerified(value: unknown) {
  return value === true || value === "true";
}

async function emailFromGoogleIdToken(idToken: string): Promise<string> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, "Google sign-in is not configured", undefined, false);
  }

  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: env.GOOGLE_CLIENT_ID,
    });
    if (!emailVerified(payload.email_verified) || typeof payload.email !== "string") {
      throw new Error("Google email is not verified");
    }
    return payload.email.trim().toLowerCase();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, "Google sign-in could not be verified. Try again.");
  }
}

async function loginSchoolOrTeacher(email: string): Promise<GoogleLoginResult> {
  const school = await schoolRepository.findSchoolByAccount({ email });
  if (school) {
    return { role: "school", ...(await issueSchoolLogin(school)) };
  }

  const teacher = await teacherRepository.findTeacherByAccount({ email });
  if (teacher) {
    return { role: "teacher", ...(await issueTeacherLogin(teacher)) };
  }

  const students = await studentRepository.findStudentsByEmail(email);
  if (students.length > 0) {
    throw new AppError(
      401,
      "This Google account is a student login. Use student sign in instead.",
    );
  }

  throw new AppError(401, UNLINKED);
}

async function loginStudent(email: string): Promise<GoogleLoginResult> {
  const students = await studentRepository.findStudentsByEmail(email);
  if (students.length > 1) {
    throw new AppError(
      401,
      "This email is used for more than one student. Sign in with roll number and password.",
    );
  }

  const student = students[0];
  if (student) {
    return { role: "student", ...(await issueStudentLogin(student)) };
  }

  const school = await schoolRepository.findSchoolByAccount({ email });
  const teacher = school
    ? null
    : await teacherRepository.findTeacherByAccount({ email });
  if (school || teacher) {
    throw new AppError(
      401,
      "This Google account is a school or teacher login. Use portal sign in instead.",
    );
  }

  throw new AppError(401, UNLINKED);
}

/** Google email must already belong to that portal. Never creates an account. */
export async function loginWithGoogle(
  idToken: string,
  portal: GooglePortal,
): Promise<GoogleLoginResult> {
  const email = await emailFromGoogleIdToken(idToken);
  return portal === "student" ? loginStudent(email) : loginSchoolOrTeacher(email);
}
