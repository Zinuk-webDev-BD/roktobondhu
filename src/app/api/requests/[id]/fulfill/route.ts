import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fulfillRequest } from "@/lib/allocation";
import { allocErrorResponse } from "@/lib/allocHttp";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await requireUser(["ADMIN", "HOSPITAL"]);
  if ("error" in r) return r.error;
  const { user } = r;

  try {
    const found = await db.bloodRequest.findUnique({ where: { id: params.id }, select: { id: true, requesterId: true } });
    if (!found) return NextResponse.json({ error: "অনুরোধটি পাওয়া যায়নি" }, { status: 404 });

    if (user.role !== "ADMIN" && found.requesterId !== user.id) {
      await audit({
        actorId: user.id,
        action: "ACCESS_DENIED",
        resource: "BloodRequest",
        resourceId: found.id,
        success: false,
        ip: clientIp(req),
        meta: { method: "FULFILL" },
      });
      return NextResponse.json({ error: "এই অনুরোধ পরিবর্তনের অনুমতি আপনার নেই" }, { status: 403 });
    }

    const res = await fulfillRequest(found.id);
    await audit({ actorId: user.id, action: "FULFILL", resource: "BloodRequest", resourceId: found.id, ip: clientIp(req), meta: { bags: res.bags } });
    return NextResponse.json({ ok: true, bags: res.bags });
  } catch (e) {
    const resp = allocErrorResponse(e);
    if (resp) return resp;
    console.error("fulfill failed", e);
    return NextResponse.json({ error: "সম্পন্ন করা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}