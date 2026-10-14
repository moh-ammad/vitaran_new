import type { SchoolType } from "@/types/school";

/** Admin list filters shared by answer keys and results. */
export type ListFilters = {
  testNumber?: number;
  type?: SchoolType;
  schoolId?: string;
};

export function listFiltersQuery({ testNumber, type, schoolId }: ListFilters = {}) {
  const query = new URLSearchParams();
  if (testNumber) query.set("testNumber", String(testNumber));
  if (type) query.set("type", type);
  if (schoolId) query.set("schoolId", schoolId);
  return query.size > 0 ? `?${query}` : "";
}
