import { db } from "./db";
import { bloodGroups } from "./validation";
import { DAY } from "./format";

export const EXPIRY_WARN_DAYS = 7;

/** মেয়াদ পেরোনো ব্যাগ স্বয়ংক্রিয়ভাবে EXPIRED হয়ে যায় */
export async function expireOldBags() {
  return db.bloodBag.updateMany({
    where: { status: "AVAILABLE", expiryDate: { lte: new Date() } },
    data: { status: "EXPIRED", version: { increment: 1 } },
  });
}

export async function getStockSummary() {
  await expireOldBags();
  const bags = await db.bloodBag.findMany({
    where: { status: "AVAILABLE" },
    select: { bloodGroup: true, expiryDate: true },
  });

  const warnAt = Date.now() + EXPIRY_WARN_DAYS * DAY;
  const rows = bloodGroups.map((g) => {
    const mine = bags.filter((b) => b.bloodGroup === g);
    const expiringSoon = mine.filter((b) => b.expiryDate.getTime() <= warnAt).length;
    const nearest = mine.length ? Math.min(...mine.map((b) => b.expiryDate.getTime())) : null;
    return {
      bloodGroup: g,
      available: mine.length,
      expiringSoon,
      nearestExpiry: nearest ? new Date(nearest).toISOString() : null,
    };
  });

  return {
    rows,
    total: bags.length,
    expiringSoon: rows.reduce((s, r) => s + r.expiringSoon, 0),
  };
}