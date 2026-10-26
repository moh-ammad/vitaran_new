import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_BASE_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_LOGOUT_PATH,
  ADMIN_SESSION_COOKIE,
  RETURN_TO_COOKIE,
  SCHOOL_BASE_PATH,
  SCHOOL_HOME_PATH,
  SCHOOL_LOGIN_PATH,
  SCHOOL_SESSION_COOKIE,
  STUDENT_HOME_PATH,
  STUDENT_LOGIN_PATH,
  STUDENT_SESSION_COOKIE,
  TEACHER_BASE_PATH,
  TEACHER_SESSION_COOKIE,
} from "@/constants/auth";

/** Shared school + teacher portal login. */
const PORTAL_LOGIN_PATH = SCHOOL_LOGIN_PATH;

const SESSION_COOKIES = [
  { name: SCHOOL_SESSION_COOKIE, path: "/" },
  { name: TEACHER_SESSION_COOKIE, path: "/" },
  { name: STUDENT_SESSION_COOKIE, path: "/" },
  { name: ADMIN_SESSION_COOKIE, path: ADMIN_BASE_PATH },
] as const;

function jwtLooksLive(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 > Date.now() + 1000;
  } catch {
    return false;
  }
}

function hasLiveSession(request: NextRequest, cookieName: string): boolean {
  const token = request.cookies.get(cookieName)?.value;
  return Boolean(token && jwtLooksLive(token));
}

function dropDeadSessions(request: NextRequest, response: NextResponse) {
  for (const { name, path } of SESSION_COOKIES) {
    const token = request.cookies.get(name)?.value;
    if (!token || jwtLooksLive(token)) continue;
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path,
      maxAge: 0,
      expires: new Date(0),
    });
  }
  return response;
}

function redirectToLogin(request: NextRequest, loginPath: string) {
  const { pathname, search } = request.nextUrl;
  if (pathname === loginPath || pathname === "/teacher/login") {
    return dropDeadSessions(request, NextResponse.next());
  }

  const response = NextResponse.redirect(new URL(loginPath, request.nextUrl));
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.cookies.set(RETURN_TO_COOKIE, pathname + search, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return dropDeadSessions(request, response);
}

function adminResponse(request: NextRequest, response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  return dropDeadSessions(request, response);
}

/** Prefer school portal routes when only a school session exists. */
function schoolPortalPath(pathname: string): string {
  if (pathname.startsWith("/teacher/resources") || pathname.startsWith("/teachers-resources")) {
    return "/school/resources";
  }
  if (pathname.startsWith("/teacher/answer-keys") || pathname.startsWith("/answer-keys")) {
    return "/school/answer-keys";
  }
  if (pathname.startsWith("/teacher/results") || pathname.startsWith("/results")) {
    return "/school/results";
  }
  if (pathname.startsWith("/teacher")) {
    return SCHOOL_HOME_PATH;
  }
  return SCHOOL_HOME_PATH;
}

// Optimistic cookie checks only; pages verify the session with the API.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSchool = hasLiveSession(request, SCHOOL_SESSION_COOKIE);
  const hasTeacher = hasLiveSession(request, TEACHER_SESSION_COOKIE);

  if (pathname.startsWith(ADMIN_BASE_PATH)) {
    if (
      pathname === ADMIN_LOGIN_PATH ||
      pathname === ADMIN_LOGOUT_PATH ||
      hasLiveSession(request, ADMIN_SESSION_COOKIE)
    ) {
      return adminResponse(request, NextResponse.next());
    }
    return adminResponse(
      request,
      NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.nextUrl)),
    );
  }

  // Login pages verify the token. Cookie-only "already signed in" redirects
  // bounce forever when the cookie is present but the API returns 401.
  if (pathname === PORTAL_LOGIN_PATH || pathname === "/teacher/login") {
    return dropDeadSessions(request, NextResponse.next());
  }

  if (pathname === STUDENT_LOGIN_PATH || pathname === "/student/login") {
    return dropDeadSessions(request, NextResponse.next());
  }

  if (pathname.startsWith(SCHOOL_BASE_PATH)) {
    if (hasSchool) return dropDeadSessions(request, NextResponse.next());
    return redirectToLogin(request, PORTAL_LOGIN_PATH);
  }

  if (pathname.startsWith(TEACHER_BASE_PATH)) {
    if (hasTeacher) return dropDeadSessions(request, NextResponse.next());
    // School session: send to the matching school page instead of the login form.
    if (hasSchool) {
      return dropDeadSessions(
        request,
        NextResponse.redirect(new URL(schoolPortalPath(pathname), request.nextUrl)),
      );
    }
    return redirectToLogin(request, PORTAL_LOGIN_PATH);
  }

  // Legacy public content pages → teacher portal, or school if only school is signed in.
  if (hasTeacher) return dropDeadSessions(request, NextResponse.next());
  if (hasSchool) {
    return dropDeadSessions(
      request,
      NextResponse.redirect(new URL(schoolPortalPath(pathname), request.nextUrl)),
    );
  }
  return redirectToLogin(request, PORTAL_LOGIN_PATH);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/school",
    "/school/:path*",
    "/teacher",
    "/teacher/:path*",
    "/teachers-resources",
    "/teachers-resources/:path*",
    "/answer-keys",
    "/answer-keys/:path*",
    "/results",
    "/results/:path*",
  ],
};
