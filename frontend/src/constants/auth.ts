export const ADMIN_SESSION_COOKIE = "vitaran_admin_session";
export const ADMIN_BASE_PATH = "/admin";
export const ADMIN_LOGIN_PATH = "/admin/login";

export const SCHOOL_SESSION_COOKIE = "vitaran_school_session";
export const SCHOOL_BASE_PATH = "/school";
export const SCHOOL_LOGIN_PATH = "/school/login";
export const SCHOOL_HOME_PATH = "/school";

export const TEACHER_SESSION_COOKIE = "vitaran_teacher_session";
export const TEACHER_BASE_PATH = "/teacher";
export const TEACHER_LOGIN_PATH = "/teacher/login";
export const TEACHER_HOME_PATH = "/teacher";

/** Page the user tried to open before being sent to login; read once after signing in. */
export const RETURN_TO_COOKIE = "vitaran_return_to";

/** Only same-site paths are allowed, so a return path can't send users to another origin. */
export function safeRedirectPath(value: unknown, fallback: string): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}
