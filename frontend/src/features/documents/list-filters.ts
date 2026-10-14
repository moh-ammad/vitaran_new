import type { ListFilters } from "@/services/list-filters";
import { SCHOOL_TYPES, type SchoolType } from "@/types/school";
import { TEST_NUMBERS } from "./constants";

/** URL search params used by the admin list filters. */
export const FILTER_PARAMS = { test: "test", type: "type", school: "school" } as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the filters from the page's search params, ignoring anything invalid. */
export function parseListFilters(params: Record<string, string | string[] | undefined>): ListFilters {
  const test = Number(first(params[FILTER_PARAMS.test]));
  const type = first(params[FILTER_PARAMS.type]);
  const school = first(params[FILTER_PARAMS.school]);
  return {
    testNumber: TEST_NUMBERS.includes(test) ? test : undefined,
    type: SCHOOL_TYPES.includes(type as SchoolType) ? (type as SchoolType) : undefined,
    schoolId: school && UUID.test(school) ? school : undefined,
  };
}

export const hasListFilters = ({ testNumber, type, schoolId }: ListFilters) =>
  Boolean(testNumber || type || schoolId);
