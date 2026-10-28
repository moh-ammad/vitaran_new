import type { Subject } from "../generated/prisma/client.js";
import * as programRepository from "../repositories/program.repository.js";
import * as schoolRepository from "../repositories/school.repository.js";
import type {
  SchoolOptionRow,
  SchoolSessionRow,
  SchoolSummaryRow,
  SchoolWithPrograms,
} from "../repositories/school.repository.js";
import * as teacherRepository from "../repositories/teacher.repository.js";
import type {
  AccountAvailabilityQuery,
  CreateSchoolInput,
  ListSchoolOptionsQuery,
  ListSchoolsQuery,
  SchoolProgramInput,
  UpdateSchoolInput,
} from "../schemas/school.schema.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { decryptSecret, encryptSecret } from "../utils/secret-box.js";
import { sendSchoolCredentialsEmail } from "./mail.service.js";

export type SchoolProgramClassDto = {
  classLevel: number;
  subjects: Subject[];
};

export type SchoolProgramDto = {
  programId: string;
  programCode: string;
  programName: string;
  year: number;
  classFrom: number;
  classTo: number;
  catalogSubjects: Subject[];
  negativeMarking: boolean;
  classes: SchoolProgramClassDto[];
};

export type SchoolSummaryDto = {
  id: string;
  code: string;
  name: string;
  board: SchoolWithPrograms["board"];
  type: SchoolWithPrograms["type"];
  status: SchoolWithPrograms["status"];
  contactName: string;
  contactEmail: string;
  city: string;
  state: string;
  createdAt: string;
};

export type SchoolOptionDto = {
  id: string;
  name: string;
  code: string;
  type: SchoolWithPrograms["type"];
  programs: string[];
  programLabels: Record<string, string>;
  offerings: { code: string; name: string; classLevels: number[] }[];
};

export type SchoolDto = SchoolSummaryDto & {
  principalName: string | null;
  contactPhone: string;
  addressLine: string;
  pincode: string;
  studentStrength: number | null;
  notes: string | null;
  accountEmail: string | null;
  accountPhone: string | null;
  schoolPrograms: SchoolProgramDto[];
  /** Convenience: catalog codes the school is enrolled in. */
  programCodes: string[];
  updatedAt: string;
};

export type SchoolDetailDto = SchoolDto & { password: string | null };

export const toSchoolRef = ({ id, name, code }: { id: string; name: string; code: string }) => ({
  id,
  name,
  code,
});

async function assertSchoolCodeAvailable(code: string, excludeId?: string) {
  const taken = await schoolRepository.findSchoolByCode(code, excludeId);
  if (taken) {
    throw new AppError(409, "School ID already in use", [
      { path: ["code"], message: "This school ID is already used" },
    ]);
  }
  return code.trim();
}

function toSchoolPrograms(school: SchoolWithPrograms): SchoolProgramDto[] {
  return school.schoolPrograms.map((row) => ({
    programId: row.programId,
    programCode: row.program.code,
    programName: row.program.name,
    year: row.program.year,
    classFrom: row.program.classFrom,
    classTo: row.program.classTo,
    catalogSubjects: row.program.subjects as Subject[],
    negativeMarking: row.negativeMarking,
    classes: row.classes.map((cls) => ({
      classLevel: cls.classLevel,
      subjects: cls.subjects as Subject[],
    })),
  }));
}

export function toSchoolSummaryDto(school: SchoolSummaryRow): SchoolSummaryDto {
  return {
    id: school.id,
    code: school.code,
    name: school.name,
    board: school.board,
    type: school.type,
    status: school.status,
    contactName: school.contactName,
    contactEmail: school.contactEmail,
    city: school.city,
    state: school.state,
    createdAt: school.createdAt.toISOString(),
  };
}

export function toSchoolOptionDto(school: SchoolOptionRow): SchoolOptionDto {
  const offerings = school.schoolPrograms.map((row) => ({
    code: row.program.code,
    name: row.program.name,
    classLevels: row.classes.map((cls) => cls.classLevel),
  }));
  return {
    id: school.id,
    name: school.name,
    code: school.code,
    type: school.type,
    programs: offerings.map((row) => row.code),
    programLabels: Object.fromEntries(offerings.map((row) => [row.code, row.name])),
    offerings,
  };
}

export function toSchoolDto(school: SchoolWithPrograms): SchoolDto {
  const schoolPrograms = toSchoolPrograms(school);
  return {
    ...toSchoolSummaryDto(school),
    principalName: school.principalName,
    contactPhone: school.contactPhone,
    addressLine: school.addressLine,
    pincode: school.pincode,
    studentStrength: school.studentStrength,
    notes: school.notes,
    accountEmail: school.accountEmail,
    accountPhone: school.accountPhone,
    schoolPrograms,
    programCodes: schoolPrograms.map((row) => row.programCode),
    updatedAt: school.updatedAt.toISOString(),
  };
}

export type SchoolAccountDto = Omit<SchoolDto, "notes">;

export function toSchoolAccountDto(school: SchoolWithPrograms): SchoolAccountDto {
  const { notes, ...rest } = toSchoolDto(school);
  void notes;
  return rest;
}

/** Nav + offerings for school portal session. No address, phones, or notes. */
export function toSchoolSessionAccountDto(school: SchoolSessionRow): SchoolAccountDto {
  const schoolPrograms: SchoolProgramDto[] = school.schoolPrograms.map((row) => ({
    programId: row.programId,
    programCode: row.program.code,
    programName: row.program.name,
    year: row.program.year,
    classFrom: row.program.classFrom,
    classTo: row.program.classTo,
    catalogSubjects: row.program.subjects as Subject[],
    negativeMarking: row.negativeMarking,
    classes: row.classes.map((cls) => ({
      classLevel: cls.classLevel,
      subjects: cls.subjects as Subject[],
    })),
  }));
  return {
    id: school.id,
    code: school.code,
    name: school.name,
    board: school.board,
    type: school.type,
    status: school.status,
    principalName: null,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    studentStrength: null,
    accountEmail: school.accountEmail,
    accountPhone: null,
    schoolPrograms,
    programCodes: schoolPrograms.map((row) => row.programCode),
    createdAt: school.createdAt.toISOString(),
    updatedAt: school.updatedAt.toISOString(),
  };
}

async function sealPassword(password: string) {
  return {
    passwordHash: await hashPassword(password),
    passwordEncrypted: encryptSecret(password),
  };
}

async function passwordChanged(id: string, password: string) {
  const current = await schoolRepository.findSchoolById(id);
  if (!current?.passwordHash || !current.passwordEncrypted) return true;
  return !(await verifyPassword(password, current.passwordHash));
}

export async function getAccountAvailability({ email, excludeId }: AccountAvailabilityQuery) {
  return { emailTaken: await schoolRepository.isEmailUsedByOtherSchool(email, excludeId) };
}

async function assertAccountAvailable(
  account: { accountEmail?: string; accountPhone?: string; contactEmail?: string },
  excludeId?: string,
) {
  const issues: { path: string[]; message: string }[] = [];

  const fields = ["accountEmail", "contactEmail"] as const;
  const [emailTaken, conflicts] = await Promise.all([
    Promise.all(
      fields.map((field) => {
        const email = account[field];
        return email ? schoolRepository.isEmailUsedByOtherSchool(email, excludeId) : false;
      }),
    ),
    schoolRepository.findAccountConflicts({ accountPhone: account.accountPhone }, excludeId),
  ]);
  fields.forEach((field, index) => {
    if (emailTaken[index]) issues.push({ path: [field], message: "Email already exists" });
  });

  if (account.accountPhone && conflicts.some((c) => c.accountPhone === account.accountPhone)) {
    issues.push({ path: ["accountPhone"], message: "This login phone is already used by another school." });
  }

  if (issues.length > 0) {
    throw new AppError(409, "These login details are already in use", issues);
  }
}

/** Offerings must stay inside each catalog program's class range and subject list. */
async function assertProgramOfferings(programs: SchoolProgramInput[]) {
  const catalogs = await Promise.all(
    programs.map((row) => programRepository.findProgramById(row.programId)),
  );
  for (const [index, row] of programs.entries()) {
    const catalog = catalogs[index];
    if (!catalog) {
      throw new AppError(400, "Unknown program", [
        { path: ["programs"], message: "Select a valid program" },
      ]);
    }
    const allowedSubjects = new Set(catalog.subjects);
    for (const cls of row.classes) {
      if (cls.classLevel < catalog.classFrom || cls.classLevel > catalog.classTo) {
        throw new AppError(400, "Class is outside the program range", [
          {
            path: ["programs"],
            message: `Class ${cls.classLevel} is outside ${catalog.name} (${catalog.classFrom}–${catalog.classTo})`,
          },
        ]);
      }
      for (const subject of cls.subjects) {
        if (!allowedSubjects.has(subject)) {
          throw new AppError(400, "Subject is not part of this program", [
            { path: ["programs"], message: `${subject} is not offered in ${catalog.name}` },
          ]);
        }
      }
    }
  }
}

export async function listSchools(query: ListSchoolsQuery) {
  const { items, total } = await schoolRepository.findSchools(query);

  return {
    items: items.map(toSchoolSummaryDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function listSchoolOptions(query: ListSchoolOptionsQuery) {
  const items = await schoolRepository.findSchoolOptions(query);
  return items.map(toSchoolOptionDto);
}

export async function getSchool(id: string): Promise<SchoolDetailDto> {
  const school = await schoolRepository.findSchoolById(id);
  if (!school) throw new AppError(404, "School not found");

  return {
    ...toSchoolDto(school),
    password: school.passwordEncrypted ? decryptSecret(school.passwordEncrypted) : null,
  };
}

export async function createSchool({ password, programs, code, ...input }: CreateSchoolInput) {
  await assertAccountAvailable(input);
  await assertProgramOfferings(programs);
  const schoolCode = await assertSchoolCodeAvailable(code);

  const school = toSchoolDto(
    await schoolRepository.createSchool({
      ...input,
      code: schoolCode,
      programs,
      ...(await sealPassword(password)),
    }),
  );

  if (school.accountEmail) {
    await sendSchoolCredentialsEmail({
      to: school.accountEmail,
      schoolName: school.name,
      loginEmail: school.accountEmail,
      loginPhone: school.accountPhone,
      password,
      reason: "created",
    });
  }

  return school;
}

export async function updateSchool(
  id: string,
  { password, programs, code, ...input }: UpdateSchoolInput,
) {
  const [, , seal, schoolCode] = await Promise.all([
    assertAccountAvailable(input, id),
    programs ? assertProgramOfferings(programs) : undefined,
    password ? passwordChanged(id, password) : false,
    code !== undefined ? assertSchoolCodeAvailable(code, id) : undefined,
  ]);

  const school = await schoolRepository.updateSchool(id, {
    ...input,
    ...(schoolCode !== undefined ? { code: schoolCode } : {}),
    ...(programs ? { programs } : {}),
    ...(seal && password ? await sealPassword(password) : {}),
  });

  if (programs) {
    await teacherRepository.pruneAssignmentsOutsideSchoolOfferings(id);
    // Rescoring touches every scan; the save must not wait on it.
    void import("./om-scan.service.js")
      .then(({ rescoreOmScansForSchool }) => rescoreOmScansForSchool(id))
      .catch((error: unknown) => logger.error({ err: error, schoolId: id }, "OMR rescore failed"));
  }

  const dto = toSchoolDto(school);

  // Admin sets a new password → school receives it by email (forgot-password flow).
  if (seal && password && dto.accountEmail) {
    await sendSchoolCredentialsEmail({
      to: dto.accountEmail,
      schoolName: dto.name,
      loginEmail: dto.accountEmail,
      loginPhone: dto.accountPhone,
      password,
      reason: "password-reset",
    });
  }

  return dto;
}

export async function deleteSchool(id: string): Promise<void> {
  await schoolRepository.deleteSchool(id);
}

/** Admin resends the current login email + password to the school account email. */
export async function sendSchoolCredentials(id: string) {
  const school = await getSchool(id);
  if (!school.accountEmail) {
    throw new AppError(400, "This school has no login email");
  }
  if (!school.password) {
    throw new AppError(400, "Set a password before sending credentials");
  }

  const sent = await sendSchoolCredentialsEmail({
    to: school.accountEmail,
    schoolName: school.name,
    loginEmail: school.accountEmail,
    loginPhone: school.accountPhone,
    password: school.password,
    reason: "resend",
  });
  if (!sent) {
    throw new AppError(502, "Could not send the email. Check SMTP settings and try again.");
  }
  return { ok: true as const, to: school.accountEmail };
}

/** Admin sets a new password and emails it to the school (forgot-password flow). */
export async function resetSchoolPassword(id: string, password: string) {
  const current = await schoolRepository.findSchoolById(id);
  if (!current) throw new AppError(404, "School not found");
  if (!current.accountEmail) {
    throw new AppError(400, "This school has no login email");
  }

  await schoolRepository.updateSchool(id, await sealPassword(password));

  const sent = await sendSchoolCredentialsEmail({
    to: current.accountEmail,
    schoolName: current.name,
    loginEmail: current.accountEmail,
    loginPhone: current.accountPhone,
    password,
    reason: "password-reset",
  });
  if (!sent) {
    throw new AppError(502, "Password was saved but the email could not be sent. Try Send credentials.");
  }
  return { ok: true as const, to: current.accountEmail };
}

export async function getSchoolStats() {
  const { recent, ...stats } = await schoolRepository.getSchoolStats();

  return {
    ...stats,
    inactive: stats.total - stats.active,
    recent: recent.map(toSchoolSummaryDto),
  };
}
