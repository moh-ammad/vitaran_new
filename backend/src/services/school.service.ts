import type { School } from "../generated/prisma/client.js";
import * as schoolRepository from "../repositories/school.repository.js";
import type {
  AccountAvailabilityQuery,
  CreateSchoolInput,
  ListSchoolsQuery,
  UpdateSchoolInput,
} from "../schemas/school.schema.js";
import { AppError } from "../utils/app-error.js";
import { hashPassword } from "../utils/password.js";

export type SchoolDto = Omit<
  School,
  "serial" | "passwordHash" | "createdAt" | "updatedAt"
> & {
  code: string;
  createdAt: string;
  updatedAt: string;
};

export function toSchoolDto(school: School): SchoolDto {
  const { serial, passwordHash, ...rest } = school;
  void passwordHash;

  return {
    ...rest,
    code: `VLS-${String(serial).padStart(4, "0")}`,
    createdAt: school.createdAt.toISOString(),
    updatedAt: school.updatedAt.toISOString(),
  };
}

export async function getAccountAvailability({ email, excludeId }: AccountAvailabilityQuery) {
  return { emailTaken: await schoolRepository.isEmailUsedByOtherSchool(email, excludeId) };
}

/** Details mirror Zod issues so clients can map them onto form fields. */
async function assertAccountAvailable(
  account: { accountEmail?: string; accountPhone?: string; contactEmail?: string },
  excludeId?: string,
) {
  const issues: { path: string[]; message: string }[] = [];

  for (const field of ["accountEmail", "contactEmail"] as const) {
    const email = account[field];
    if (email && (await schoolRepository.isEmailUsedByOtherSchool(email, excludeId))) {
      issues.push({ path: [field], message: "Email already exists" });
    }
  }

  const conflicts = await schoolRepository.findAccountConflicts(
    { accountPhone: account.accountPhone },
    excludeId,
  );
  if (account.accountPhone && conflicts.some((c) => c.accountPhone === account.accountPhone)) {
    issues.push({ path: ["accountPhone"], message: "This login phone is already used by another school." });
  }

  if (issues.length > 0) {
    throw new AppError(409, "These login details are already in use", issues);
  }
}

export async function listSchools(query: ListSchoolsQuery) {
  const { items, total } = await schoolRepository.findSchools(query);

  return {
    items: items.map(toSchoolDto),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function getSchool(id: string): Promise<SchoolDto> {
  const school = await schoolRepository.findSchoolById(id);

  if (!school) {
    throw new AppError(404, "School not found");
  }

  return toSchoolDto(school);
}

export async function createSchool({ password, ...input }: CreateSchoolInput) {
  await assertAccountAvailable(input);

  return toSchoolDto(
    await schoolRepository.createSchool({
      ...input,
      passwordHash: await hashPassword(password),
    }),
  );
}

export async function updateSchool(
  id: string,
  { password, ...input }: UpdateSchoolInput,
) {
  await assertAccountAvailable(input, id);

  return toSchoolDto(
    await schoolRepository.updateSchool(id, {
      ...input,
      ...(password && { passwordHash: await hashPassword(password) }),
    }),
  );
}

export async function deleteSchool(id: string): Promise<void> {
  await schoolRepository.deleteSchool(id);
}

export async function getSchoolStats() {
  const { recent, ...stats } = await schoolRepository.getSchoolStats();

  return {
    ...stats,
    inactive: stats.total - stats.active,
    recent: recent.map(toSchoolDto),
  };
}
