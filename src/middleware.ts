import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const middlewareSecret = process.env.MIDDLEWARE_SECRET;

  // sessionId 쿠키 생성/읽기
  let sessionId = request.cookies.get("tg-session")?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set("tg-session", sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  const path = request.nextUrl.pathname;
  const body = JSON.stringify({
    path,
    ip:        request.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    country:   request.headers.get("x-vercel-ip-country") ?? null,
    city:      request.headers.get("x-vercel-ip-city")    ?? null,
    userAgent: request.headers.get("user-agent")          ?? null,
    referrer:  request.headers.get("referer")             ?? null,
    sessionId,
  });

  if (middlewareSecret) {
    fetch(`${request.nextUrl.origin}/api/admin/log-pageview`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-middleware-token": middlewareSecret,
      },
      body,
    }).catch(() => {});
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)" ],
};
