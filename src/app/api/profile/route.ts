import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fieldErrors } from "@/lib/validation";
import { profileUpdateSchema } from "@/lib/profileSchema";

export async function PUT(req: Request) {
  const r = await requireUser(["DONOR"]);
  if ("error" in r) return r.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধের ফরম্যাট ভুল" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ফর্মে ভুল আছে", fields: fieldErrors(parsed.error) }, { status: 422 });
  }
  const v = parsed.data;

  try {
    // রক্তের গ্রুপ ও জন্মতারিখ এখানে বদলানো যায় না, তাই ইচ্ছাকৃতভাবে data-তে নেই
    const res = await db.donorProfile.updateMany({
      where: { userId: r.user.id },
      data: {
        weightKg: v.weightKg,
        district: v.district,
        phone: v.phone,
        isAvailable: v.isAvailable,
        lastDonationDate: v.lastDonationDate ? new Date(`${v.lastDonationDate}T12:00:00`) : null,
      },
    });
    if (res.count === 0) return NextResponse.json({ error: "প্রোফাইল পাওয়া যায়নি" }, { status: 404 });

    await audit({ actorId: r.user.id, action: "PROFILE_UPDATE", resource: "DonorProfile", ip: clientIp(req) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("profile update failed", e);
    return NextResponse.json({ error: "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  }
}