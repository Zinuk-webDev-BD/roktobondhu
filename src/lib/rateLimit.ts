// সহজ in-memory রেট লিমিটার। একাধিক সার্ভার instance থাকলে Redis লাগবে (README-তে সীমাবদ্ধতা হিসেবে লিখব)।
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || rec.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  rec.count += 1;
  if (rec.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((rec.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSec: 0 };
}