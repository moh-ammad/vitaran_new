import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_LOGIN_PATH, ADMIN_SESSION_COOKIE } from "@/constants/auth";

// Optimistic cookie check only; pages verify the session with the API.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  if (!request.cookies.has(ADMIN_SESSION_COOKIE)) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
