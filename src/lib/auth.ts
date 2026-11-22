import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";
import { COOKIE_NAME, readSession, type Role } from "./session";

/** টোকেন ঠিক থাকলেও ডাটাবেসে ব্যবহারকারী সক্রিয় কি না যাচাই হয়। */
export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = await readSession(token);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** API route-এর জন্য role guard। ব্যর্থ হলে সরাসরি Response ফেরত দেয়। */
export async function requireUser(
  allowed?: Role[]
): Promise<{ user: CurrentUser } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "আগে লগইন করুন" }, { status: 401 }) };
  }
  if (allowed && !allowed.includes(user.role)) {
    return { error: NextResponse.json({ error: "এই কাজের অনুমতি আপনার নেই" }, { status: 403 }) };
  }
  return { user };
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || null;
}