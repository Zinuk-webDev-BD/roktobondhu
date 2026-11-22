import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, clientIp, type CurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fieldErrors } from "@/lib/validation";
import { requestEditSchema } from "@/lib/requestSchemas";
import { canTransition, DELETABLE } from "@/lib/requestFlow";
import { statusLabel, type RequestStatus } from "@/lib/labels";

async function authorize(id: string, user: CurrentUser, req: Request) {
  const found = await db.bloodRequest.findUnique({ where: { id } });
  if (!found) return { error: NextResponse.json({ error: "অনুরোধটি পাওয়া যায়নি" }, { status: 404 }) };

  // রিসোর্স-ভিত্তিক অনুমতি: মালিক বা অ্যাডমিন ছাড়া কেউ নয়
  if (user.role !== "ADMIN" && found.requesterId !== user.id) {
    await audit({
      actorId: user.id,
      action: "ACCESS_DENIED",
      resource: "BloodRequest",
      resourceId: id,
      success: false,
      ip: clientIp(req),
      meta: { method: req.method },
    });
    return { error: NextResponse.json({ error: "এই অনুরোধ পরিবর্তনের অনুমতি আপনার নেই" }, { status: 403 }) };
  }
  return { found };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await requireUser(["HOSPITAL", "ADMIN"]);
  if ("error" in r) return r.error;
  const a = await authorize(params.id, r.user, req);
  if ("error" in a) return a.error;
  const { found } = a;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধের ফরম্যাট ভুল" }, { status: 400 });
  }

  try {
    // বাতিল
    if (body.action === "cancel") {
      if (!canTransition(found.status as RequestStatus, "CANCELLED")) {
        return NextResponse.json(
          { error: `'${statusLabel[found.status as RequestStatus]}' অবস্থার অনুরোধ বাতিল করা যায় না` },
          { status: 409 }
        );
      }
      // অবস্থা ঠিক আগের মতো থাকলেই বদলাবে; ইতিমধ্যে বদলে গেলে count = 0
      const res = await db.bloodRequest.updateMany({
        where: { id: found.id, status: found.status },
        data: { status: "CANCELLED" },
      });
      if (res.count === 0) {
        return NextResponse.json({ error: "অনুরোধের অবস্থা এইমাত্র বদলে গেছে। পেজ রিফ্রেশ করুন" }, { status: 409 });
      }
      await audit({ actorId: r.user.id, action: "REQUEST_CANCEL", resource: "BloodRequest", resourceId: found.id, ip: clientIp(req) });
      return NextResponse.json({ ok: true });
    }

    // সম্পাদনা: শুধু অপেক্ষমাণ অবস্থায়
    if (found.status !== "PENDING") {
      return NextResponse.json({ error: "শুধু অপেক্ষমাণ অনুরোধ সম্পাদনা করা যায়" }, { status: 409 });
    }
    const parsed = requestEditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ফর্মে ভুল আছে", fields: fieldErrors(parsed.error) }, { status: 422 });
    }
    const v = parsed.data;
    const res = await db.bloodRequest.updateMany({
      where: { id: found.id, status: "PENDING" },
      data: { units: v.units, urgency: v.urgency, note: v.note || null, expiresAt: new Date(`${v.expiresAt}T23:59:59`) },
    });
    if (res.count === 0) {
      return NextResponse.json({ error: "অনুরোধের অবস্থা এইমাত্র বদলে গেছে। পেজ রিফ্রেশ করুন" }, { status: 409 });
    }
    await audit({ actorId: r.user.id, action: "REQUEST_UPDATE", resource: "BloodRequest", resourceId: found.id, ip: clientIp(req) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("request update failed", e);
    return NextResponse.json({ error: "পরিবর্তন করা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const r = await requireUser(["HOSPITAL", "ADMIN"]);
  if ("error" in r) return r.error;
  const a = await authorize(params.id, r.user, req);
  if ("error" in a) return a.error;

  try {
    const res = await db.bloodRequest.deleteMany({ where: { id: a.found.id, status: { in: DELETABLE } } });
    if (res.count === 0) {
      return NextResponse.json({ error: "বরাদ্দ হওয়া বা সম্পন্ন অনুরোধ মোছা যায় না" }, { status: 409 });
    }
    await audit({ actorId: r.user.id, action: "REQUEST_DELETE", resource: "BloodRequest", resourceId: a.found.id, ip: clientIp(req) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("request delete failed", e);
    return NextResponse.json({ error: "মোছা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}