export const ADMIN_ANALYSIS_PATH = "/admin/analysis";
export const SCHOOL_ANALYSIS_PATH = "/school/analysis";
export const TEACHER_ANALYSIS_PATH = "/teacher/analysis";

export type AnalysisParams = {
  school?: string | null;
  program?: string | null;
  class?: number | string | null;
  section?: string | null;
  test?: string | null;
};

export function analysisHref(basePath: string, params: AnalysisParams) {
  const search = new URLSearchParams();
  if (params.school) search.set("school", params.school);
  if (params.program) search.set("program", params.program);
  if (params.class != null && params.class !== "") search.set("class", String(params.class));
  if (params.section) search.set("section", params.section);
  if (params.test) search.set("test", params.test);
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function analysisApiQuery(params: AnalysisParams) {
  const href = analysisHref("", params);
  return href.startsWith("?") ? href : "";
}
