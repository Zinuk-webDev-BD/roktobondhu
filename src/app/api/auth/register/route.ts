import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { registerSchema, fieldErrors } from "@/lib/validation";
import { signSession, COOKIE_NAME, cookieOptions } from "@/lib/session";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const ip = clientIp(req) ?? "unknown";
  const rl = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `অনেকবার চেষ্টা হয়েছে। ${rl.retryAfterSec} সেকেন্ড পরে আবার চেষ্টা করুন` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধের ফরম্যাট ভুল" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ফর্মে ভুল আছে", fields: fieldErrors(parsed.error) },
      { status: 422 }
    );
  }
  const v = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(v.password, 12);
    const user = await db.user.create({
      data: {
        name: v.name,
        email: v.email,
        passwordHash,
        role: v.role,
        ...(v.role === "DONOR"
          ? {
              donorProfile: {
                create: {
                  bloodGroup: v.bloodGroup!,
                  dateOfBirth: new Date(v.dateOfBirth!),
                  weightKg: v.weightKg!,
                  district: v.district!,
                  phone: v.phone!,
                },
              },
            }
          : {}),
      },
      select: { id: true, name: true, role: true },
    });

    await audit({ actorId: user.id, action: "AUTH_REGISTER", resource: "User", resourceId: user.id, ip });

    const token = await signSession({ sub: user.id, role: user.role, name: user.name });
    const res = NextResponse.json({ ok: true, user }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (e) {
    // একই ইমেইলে একসঙ্গে দুই রেজিস্ট্রেশন হলেও ডাটাবেস unique constraint আটকাবে
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "ফর্মে ভুল আছে", fields: { email: "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে" } },
        { status: 409 }
      );
    }
    console.error("register failed", e);
    return NextResponse.json(
      { error: "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন" },
      { status: 500 }
    );
  }
}