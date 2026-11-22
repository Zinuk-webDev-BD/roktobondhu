import { NextResponse } from "next/server";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { allocateForRequest, AllocError } from "@/lib/allocation";
import { allocErrorResponse } from "@/lib/allocHttp";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await requireUser(["ADMIN"]);
  if ("error" in r) return r.error;

  const key = req.headers.get("idempotency-key") ?? "";
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(key)) {
    return NextResponse.json({ error: "Idempotency-Key হেডার (৮-৮০ অক্ষর) দিতে হবে" }, { status: 400 });
  }

  try {
    const result = await allocateForRequest({ requestId: params.id, key });
    await audit({
      actorId: r.user.id,
      action: result.replayed ? "ALLOCATE_REPLAY" : "ALLOCATE",
      resource: "BloodRequest",
      resourceId: params.id,
      ip: clientIp(req),
      meta: { bags: result.bags.map((b) => b.bagId) },
    });
    return NextResponse.json({ ok: true, replayed: result.replayed, bags: result.bags }, { status: result.replayed ? 200 : 201 });
  } catch (e) {
    const resp = allocErrorResponse(e);
    if (resp) {
      if (e instanceof AllocError) {
        await audit({
          actorId: r.user.id,
          action: "ALLOCATE_FAILED",
          resource: "BloodRequest",
          resourceId: params.id,
          success: false,
          ip: clientIp(req),
          meta: { code: e.code, ...(e.extra ?? {}) },
        });
      }
      return resp;
    }
    console.error("allocate failed", e);
    return NextResponse.json({ error: "বরাদ্দ করা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}