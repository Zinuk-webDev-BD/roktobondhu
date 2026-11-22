import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, readSession } from "@/lib/session";

const PUBLIC_API = ["/api/auth/login", "/api/auth/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req.cookies.get(COOKIE_NAME)?.value);

  const isApi = pathname.startsWith("/api/");
  if (isApi && PUBLIC_API.includes(pathname)) return NextResponse.next();

  if (!session) {
    if (isApi) return NextResponse.json({ error: "আগে লগইন করুন" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (session.role !== "ADMIN") {
      return isApi
        ? NextResponse.json({ error: "এই কাজের অনুমতি আপনার নেই" }, { status: 403 })
        : NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/((?!_next).*)"],
};