import { db } from "./db";
import { bloodGroupLabel } from "./validation";
import { donorEligibility, donorGroupsFor, type BG } from "./blood";
import { bn, DAY } from "./format";

export type Suggestion = { id: string; name: string; bloodGroup: BG; district: string; score: number; reasons: string[] };
export type Excluded = { id: string; name: string; bloodGroup: BG; reasons: string[] };

export async function suggestDonors(request: { bloodGroup: BG; district: string }) {
  const now = new Date();
  const donors = await db.donorProfile.findMany({
    where: { bloodGroup: { in: donorGroupsFor(request.bloodGroup) }, user: { isActive: true } },
    include: { user: { select: { id: true, name: true } } },
    take: 300,
  });

  const eligible: Suggestion[] = [];
  const excluded: Excluded[] = [];

  for (const d of donors) {
    const el = donorEligibility(d, now);
    if (!el.eligible) {
      excluded.push({ id: d.user.id, name: d.user.name, bloodGroup: d.bloodGroup, reasons: el.reasons });
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    if (d.district.trim() === request.district.trim()) {
      score += 3;
      reasons.push(`একই জেলা (${d.district})`);
    }
    if (d.bloodGroup === request.bloodGroup) {
      score += 2;
      reasons.push("একই রক্তের গ্রুপ");
    } else {
      reasons.push(`গ্রুপ সামঞ্জস্যপূর্ণ (${bloodGroupLabel[d.bloodGroup]} থেকে ${bloodGroupLabel[request.bloodGroup]})`);
    }
    if (!d.lastDonationDate) {
      score += 1;
      reasons.push("আগে কখনো রক্ত দেননি");
    } else {
      const since = (now.getTime() - d.lastDonationDate.getTime()) / DAY;
      if (since >= 180) {
        score += 1;
        reasons.push(`শেষ দান ${bn(Math.floor(since))} দিন আগে`);
      }
    }

    eligible.push({ id: d.user.id, name: d.user.name, bloodGroup: d.bloodGroup, district: d.district, score, reasons });
  }

  eligible.sort((a, b) => b.score - a.score);
  return { eligible: eligible.slice(0, 10), eligibleTotal: eligible.length, excluded, compatibleTotal: donors.length };
}