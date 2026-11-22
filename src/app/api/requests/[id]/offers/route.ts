import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { canDonate, donorEligibility } from "@/lib/blood";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await requireUser(["DONOR"]);
  if ("error" in r) return r.error;
  const { user } = r;

  try {
    const profile = await db.donorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "আপনার দাতা প্রোফাইল পাওয়া যায়নি" }, { status: 404 });

    const request = await db.bloodRequest.findUnique({ where: { id: params.id } });
    if (!request) return NextResponse.json({ error: "অনুরোধটি পাওয়া যায়নি" }, { status: 404 });

    if (request.status !== "PENDING" || request.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "এই অনুরোধ আর খোলা নেই" }, { status: 409 });
    }
    if (!canDonate(profile.bloodGroup, request.bloodGroup)) {
      return NextResponse.json({ error: "আপনার রক্তের গ্রুপ এই রোগীর সঙ্গে মেলে না" }, { status: 422 });
    }
    const el = donorEligibility(profile);
    if (!el.eligible) {
      return NextResponse.json({ error: `এখন সাড়া দেওয়া যাচ্ছে না: ${el.reasons[0]}` }, { status: 422 });
    }

    await db.donationOffer.create({ data: { requestId: request.id, donorId: user.id } });
    await audit({ actorId: user.id, action: "OFFER_CREATE", resource: "BloodRequest", resourceId: request.id, ip: clientIp(req) });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    // (requestId, donorId) unique, তাই দ্বিতীয়বার সাড়া দিলে এখানে আসবে
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "আপনি আগেই এই অনুরোধে সাড়া দিয়েছেন" }, { status: 409 });
    }
    console.error("offer failed", e);
    return NextResponse.json({ error: "সাড়া পাঠানো যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}