import { db } from "./db";

/** মেয়াদ পেরোনো অপেক্ষমাণ অনুরোধ স্বয়ংক্রিয়ভাবে EXPIRED হয় */
export async function expireOldRequests() {
  return db.bloodRequest.updateMany({
    where: { status: "PENDING", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
  });
}