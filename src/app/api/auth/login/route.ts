import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema, fieldErrors } from "@/lib/validation";
import { signSession, COOKIE_NAME, cookieOptions } from "@/lib/session";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

// ইমেইল আছে কি না বাইরে থেকে বোঝা যাতে না যায়
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

export async function POST(req: Request) {
  const ip = clientIp(req) ?? "unknown";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধের ফরম্যাট ভুল" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ফর্মে ভুল আছে", fields: fieldErrors(parsed.error) }, { status: 422 });
  }
  const { email, password } = parsed.data;

  // ১৫ মিনিটে ৫ বারের বেশি চেষ্টা নয়
  const rl = rateLimit(`login:${ip}:${email}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    await audit({ action: "AUTH_LOGIN_BLOCKED", success: false, ip, meta: { email } });
    return NextResponse.json(
      { error: `অনেকবার ভুল চেষ্টা হয়েছে। ${Math.ceil(rl.retryAfterSec / 60)} মিনিট পরে আবার চেষ্টা করুন` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !ok || !user.isActive) {
      await audit({ actorId: user?.id, action: "AUTH_LOGIN_FAILED", success: false, ip, meta: { email } });
      return NextResponse.json({ error: "ইমেইল বা পাসওয়ার্ড সঠিক নয়" }, { status: 401 });
    }

    await audit({ actorId: user.id, action: "AUTH_LOGIN", ip });
    const token = await signSession({ sub: user.id, role: user.role, name: user.name });
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (e) {
    console.error("login failed", e);
    return NextResponse.json(
      { error: "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন" },
      { status: 500 }
    );
  }
}