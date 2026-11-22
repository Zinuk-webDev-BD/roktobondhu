import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fieldErrors } from "@/lib/validation";
import { requestCreateSchema, requestQuerySchema } from "@/lib/requestSchemas";
import { expireOldRequests } from "@/lib/requests";
import { recipientGroupsFor } from "@/lib/blood";

export async function GET(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;
  const { user } = r;

  const q = requestQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!q.success) {
    return NextResponse.json({ error: "ফিল্টারে ভুল আছে", fields: fieldErrors(q.error) }, { status: 422 });
  }
  const { status, group, urgency, q: search, sort, order } = q.data;

  const orderBy: Prisma.BloodRequestOrderByWithRelationInput[] =
    sort === "urgency" ? [{ urgency: order }, { createdAt: "asc" }] : sort === "expires" ? [{ expiresAt: order }] : [{ createdAt: order }];

  try {
    await expireOldRequests();

    // দাতা: শুধু নিজের গ্রুপ দিতে পারে এমন খোলা অনুরোধ, রোগীর নাম ছাড়া
    if (user.role === "DONOR") {
      const profile = await db.donorProfile.findUnique({ where: { userId: user.id } });
      if (!profile) return NextResponse.json({ requests: [] });
      const rows = await db.bloodRequest.findMany({
        where: {
          status: "PENDING",
          expiresAt: { gt: new Date() },
          bloodGroup: { in: recipientGroupsFor(profile.bloodGroup) },
        },
        orderBy,
        take: 100,
        select: {
          id: true,
          bloodGroup: true,
          units: true,
          urgency: true,
          hospital: true,
          district: true,
          expiresAt: true,
          createdAt: true,
          offers: { where: { donorId: user.id }, select: { id: true } },
        },
      });
      return NextResponse.json({
        requests: rows.map(({ offers, ...rest }) => ({ ...rest, offered: offers.length > 0 })),
      });
    }

    // হাসপাতাল: শুধু নিজের অনুরোধ। অ্যাডমিন: সব
    const scope: Prisma.BloodRequestWhereInput = user.role === "HOSPITAL" ? { requesterId: user.id } : {};
    const where: Prisma.BloodRequestWhereInput = {
      ...scope,
      ...(status ? { status } : {}),
      ...(group ? { bloodGroup: group } : {}),
      ...(urgency ? { urgency } : {}),
      ...(search
        ? {
            OR: [
              { patientName: { contains: search, mode: "insensitive" } },
              { hospital: { contains: search, mode: "insensitive" } },
              { district: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [requests, grouped] = await Promise.all([
      db.bloodRequest.findMany({
        where,
        orderBy,
        take: 100,
        select: {
          id: true,
          patientName: true,
          bloodGroup: true,
          units: true,
          urgency: true,
          status: true,
          hospital: true,
          district: true,
          expiresAt: true,
          createdAt: true,
          _count: { select: { offers: true } },
        },
      }),
      db.bloodRequest.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
    ]);

    const summary: Record<string, number> = {};
    for (const g of grouped) summary[g.status] = g._count._all;
    return NextResponse.json({ requests, summary });
  } catch (e) {
    console.error("requests list failed", e);
    return NextResponse.json({ error: "তালিকা আনা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const r = await requireUser(["HOSPITAL"]);
  if ("error" in r) return r.error;
  const { user } = r;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধের ফরম্যাট ভুল" }, { status: 400 });
  }

  const parsed = requestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ফর্মে ভুল আছে", fields: fieldErrors(parsed.error) }, { status: 422 });
  }
  const v = parsed.data;

  try {
    // ডুপ্লিকেট প্রতিরোধ: একই রোগী ও গ্রুপের খোলা অনুরোধ আগেই আছে কি না
    const dup = await db.bloodRequest.findFirst({
      where: {
        requesterId: user.id,
        bloodGroup: v.bloodGroup,
        patientName: { equals: v.patientName, mode: "insensitive" },
        status: { in: ["PENDING", "MATCHED"] },
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { error: "ফর্মে ভুল আছে", fields: { patientName: "এই রোগীর জন্য একই গ্রুপের অনুরোধ আগেই খোলা আছে" } },
        { status: 409 }
      );
    }

    const created = await db.bloodRequest.create({
      data: {
        requesterId: user.id,
        patientName: v.patientName,
        bloodGroup: v.bloodGroup,
        units: v.units,
        urgency: v.urgency,
        hospital: user.name, // হাসপাতালের নাম ক্লায়েন্ট থেকে নেওয়া হয় না
        district: v.district,
        note: v.note || null,
        expiresAt: new Date(`${v.expiresAt}T23:59:59`),
      },
      select: { id: true },
    });

    await audit({
      actorId: user.id,
      action: "REQUEST_CREATE",
      resource: "BloodRequest",
      resourceId: created.id,
      ip: clientIp(req),
      meta: { bloodGroup: v.bloodGroup, units: v.units, urgency: v.urgency },
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error("request create failed", e);
    return NextResponse.json({ error: "অনুরোধ জমা হয়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}