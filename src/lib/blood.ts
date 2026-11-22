import { bloodGroups } from "./validation";
import { bn, DAY } from "./format";

export type BG = (typeof bloodGroups)[number];

// কোন গ্রুপের দাতা কোন গ্রুপের রোগীকে রক্ত দিতে পারে
export const GIVES: Record<BG, BG[]> = {
  O_NEG: ["O_NEG", "O_POS", "A_NEG", "A_POS", "B_NEG", "B_POS", "AB_NEG", "AB_POS"],
  O_POS: ["O_POS", "A_POS", "B_POS", "AB_POS"],
  A_NEG: ["A_NEG", "A_POS", "AB_NEG", "AB_POS"],
  A_POS: ["A_POS", "AB_POS"],
  B_NEG: ["B_NEG", "B_POS", "AB_NEG", "AB_POS"],
  B_POS: ["B_POS", "AB_POS"],
  AB_NEG: ["AB_NEG", "AB_POS"],
  AB_POS: ["AB_POS"],
};

export const canDonate = (donor: BG, recipient: BG) => GIVES[donor].includes(recipient);
export const recipientGroupsFor = (donor: BG): BG[] => GIVES[donor];
export const donorGroupsFor = (recipient: BG): BG[] => bloodGroups.filter((d) => GIVES[d].includes(recipient));

export const RULES = { minAge: 18, maxAge: 60, minWeight: 50, gapDays: 90 } as const;

export function ageOf(dob: Date, now = new Date()) {
  let a = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
  return a;
}

type ProfileLike = { dateOfBirth: Date; weightKg: number; lastDonationDate: Date | null; isAvailable: boolean };

export function donorEligibility(p: ProfileLike, now = new Date()) {
  const reasons: string[] = [];
  let nextEligibleDate: Date | null = null;

  const age = ageOf(p.dateOfBirth, now);
  if (age < RULES.minAge) reasons.push(`বয়স ${bn(age)} বছর, কমপক্ষে ${bn(RULES.minAge)} বছর লাগবে`);
  else if (age > RULES.maxAge) reasons.push(`বয়স ${bn(age)} বছর, সর্বোচ্চ ${bn(RULES.maxAge)} বছর পর্যন্ত`);

  if (p.weightKg < RULES.minWeight) reasons.push(`ওজন ${bn(p.weightKg)} কেজি, কমপক্ষে ${bn(RULES.minWeight)} কেজি লাগবে`);

  if (p.lastDonationDate) {
    const next = new Date(p.lastDonationDate.getTime() + RULES.gapDays * DAY);
    if (next.getTime() > now.getTime()) {
      const left = Math.ceil((next.getTime() - now.getTime()) / DAY);
      reasons.push(`শেষ দানের পর ${bn(RULES.gapDays)} দিন পার হয়নি, আর ${bn(left)} দিন বাকি`);
      nextEligibleDate = next;
    }
  }

  if (!p.isAvailable) reasons.push("নিজেকে 'অনুপলব্ধ' চিহ্নিত করা আছে");

  return { eligible: reasons.length === 0, reasons, nextEligibleDate, age };
}