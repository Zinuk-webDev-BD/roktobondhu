import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { getCurrentUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user) await audit({ actorId: user.id, action: "AUTH_LOGOUT", ip: clientIp(req) });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}