import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const r = await requireUser(["ADMIN"]);
  if ("error" in r) return r.error;

  try {
    const res = await db.bloodBag.deleteMany({ where: { id: params.id, status: "AVAILABLE" } });
    if (res.count === 0) {
      const exists = await db.bloodBag.findUnique({ where: { id: params.id }, select: { id: true } });
      return NextResponse.json(
        { error: exists ? "শুধু 'প্রস্তুত' অবস্থার ব্যাগ মোছা যায়" : "ব্যাগটি পাওয়া যায়নি" },
        { status: exists ? 409 : 404 }
      );
    }
    await audit({ actorId: r.user.id, action: "BAG_DELETE", resource: "BloodBag", resourceId: params.id, ip: clientIp(req) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("bag delete failed", e);
    return NextResponse.json({ error: "ব্যাগ মোছা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}