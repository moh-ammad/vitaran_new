import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_BASE_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_COOKIE,
  RETURN_TO_COOKIE,
  SCHOOL_LOGIN_PATH,
  SCHOOL_SESSION_COOKIE,
} from "@/constants/auth";

// Optimistic cookie checks only; pages verify the session with the API.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith(ADMIN_BASE_PATH)) {
    if (pathname === ADMIN_LOGIN_PATH || request.cookies.has(ADMIN_SESSION_COOKIE)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.nextUrl));
  }

  // Teachers resources and answer keys: school sign-in only.
  if (request.cookies.has(SCHOOL_SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(new URL(SCHOOL_LOGIN_PATH, request.nextUrl));
  response.cookies.set(RETURN_TO_COOKIE, pathname + search, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}

// Matchers have to be literals.
export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/teachers-resources",
    "/teachers-resources/:path*",
    "/answer-keys",
    "/answer-keys/:path*",
  ],
};
