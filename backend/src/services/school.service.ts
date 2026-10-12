import type { School } from "../generated/prisma/client.js";
import * as schoolRepository from "../repositories/school.repository.js";
import type {
  CreateSchoolInput,
  ListSchoolsQuery,
  UpdateSchoolInput,
} from "../schemas/school.schema.js";
import { AppError } from "../utils/app-error.js";

export type SchoolDto = Omit<School, "serial" | "createdAt" | "updatedAt"> & {
  code: string;
  createdAt: string;
  updatedAt: string;
};

export function toSchoolDto({ serial, ...school }: School): SchoolDto {
  return {
    ...school,
    code: `VLS-${String(serial).padStart(4, "0")}`,
    createdAt: school.createdAt.toISOString(),
    updatedAt: school.updatedAt.toISOString(),
  };
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

export async function createSchool(input: CreateSchoolInput) {
  return toSchoolDto(await schoolRepository.createSchool(input));
}

export async function updateSchool(id: string, input: UpdateSchoolInput) {
  return toSchoolDto(await schoolRepository.updateSchool(id, input));
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
