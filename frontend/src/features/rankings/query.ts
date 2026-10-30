export type RankingRole = "admin" | "school" | "teacher" | "student";

export type RankingParams = {
  school?: string | null;
  program?: string | null;
  class?: number | string | null;
  mode?: "test" | "overall" | null;
  test?: string | null;
  testNumber?: number | string | null;
  format?: "xlsx" | "pdf" | null;
};

export type RankingDownloadRole = Exclude<RankingRole, "student">;

export const RANKING_FILE_PATH: Record<RankingDownloadRole, string> = {
  admin: "/admin/rankings/file",
  school: "/school/rankings/file",
  teacher: "/teacher/rankings/file",
};

export function rankingApiQuery(params: RankingParams) {
  const search = new URLSearchParams();
  if (params.school) search.set("school", params.school);
  if (params.program) search.set("program", params.program);
  if (params.class != null && params.class !== "") search.set("class", String(params.class));
  if (params.mode) search.set("mode", params.mode);
  if (params.test) search.set("test", params.test);
  if (params.testNumber != null && params.testNumber !== "") search.set("testNumber", String(params.testNumber));
  if (params.format) search.set("format", params.format);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function rankingFileHref(role: RankingDownloadRole, params: RankingParams, format: "xlsx" | "pdf") {
  const query = rankingApiQuery({ ...params, format });
  return `${RANKING_FILE_PATH[role]}${query}${query ? "&" : "?"}download=1`;
}
