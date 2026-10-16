import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_BASE_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  RETURN_TO_COOKIE,
  SCHOOL_BASE_PATH,
  SCHOOL_LOGIN_PATH,
  SCHOOL_SESSION_COOKIE,
  TEACHER_BASE_PATH,
  TEACHER_LOGIN_PATH,
  TEACHER_SESSION_COOKIE,
} from "@/constants/auth";

function redirectToLogin(request: NextRequest, loginPath: string) {
  const { pathname, search } = request.nextUrl;
  const response = NextResponse.redirect(new URL(loginPath, request.nextUrl));
  response.cookies.set(RETURN_TO_COOKIE, pathname + search, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}

// Optimistic cookie checks only; pages verify the session with the API.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(ADMIN_BASE_PATH)) {
    if (pathname === ADMIN_LOGIN_PATH || request.cookies.has(ADMIN_SESSION_COOKIE)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.nextUrl));
  }

  if (pathname.startsWith(SCHOOL_BASE_PATH)) {
    if (pathname === SCHOOL_LOGIN_PATH || request.cookies.has(SCHOOL_SESSION_COOKIE)) {
      return NextResponse.next();
    }
    return redirectToLogin(request, SCHOOL_LOGIN_PATH);
  }

  if (pathname.startsWith(TEACHER_BASE_PATH)) {
    if (pathname === TEACHER_LOGIN_PATH || request.cookies.has(TEACHER_SESSION_COOKIE)) {
      return NextResponse.next();
    }
    return redirectToLogin(request, TEACHER_LOGIN_PATH);
  }

  // Legacy public content pages: teachers only.
  if (request.cookies.has(TEACHER_SESSION_COOKIE)) {
    return NextResponse.next();
  }

  return redirectToLogin(request, TEACHER_LOGIN_PATH);
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
