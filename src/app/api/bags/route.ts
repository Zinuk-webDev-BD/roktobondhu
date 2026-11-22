import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fieldErrors } from "@/lib/validation";
import { bagCreateSchema, bagQuerySchema } from "@/lib/stockSchemas";
import { expireOldBags } from "@/lib/stock";

export async function GET(req: Request) {
  const r = await requireUser(["ADMIN"]);
  if ("error" in r) return r.error;

  const q = bagQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!q.success) {
    return NextResponse.json({ error: "ফিল্টারে ভুল আছে", fields: fieldErrors(q.error) }, { status: 422 });
  }
  const { group, status, sort, order } = q.data;

  try {
    await expireOldBags();
    const bags = await db.bloodBag.findMany({
      where: { ...(group ? { bloodGroup: group } : {}), ...(status ? { status } : {}) },
      orderBy: sort === "expiry" ? { expiryDate: order } : { createdAt: order },
      take: 200,
      select: { id: true, bloodGroup: true, status: true, expiryDate: true, createdAt: true },
    });
    return NextResponse.json({ bags });
  } catch (e) {
    console.error("bags list failed", e);
    return NextResponse.json({ error: "তালিকা আনা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const r = await requireUser(["ADMIN"]);
  if ("error" in r) return r.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধের ফরম্যাট ভুল" }, { status: 400 });
  }

  const parsed = bagCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ফর্মে ভুল আছে", fields: fieldErrors(parsed.error) }, { status: 422 });
  }
  const { bloodGroup, quantity, expiryDate } = parsed.data;

  try {
    const res = await db.bloodBag.createMany({
      data: Array.from({ length: quantity }, () => ({ bloodGroup, expiryDate: new Date(expiryDate) })),
    });
    await audit({
      actorId: r.user.id,
      action: "BAG_CREATE",
      resource: "BloodBag",
      ip: clientIp(req),
      meta: { bloodGroup, quantity, expiryDate },
    });
    return NextResponse.json({ ok: true, created: res.count }, { status: 201 });
  } catch (e) {
    console.error("bag create failed", e);
    return NextResponse.json({ error: "ব্যাগ যোগ করা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}