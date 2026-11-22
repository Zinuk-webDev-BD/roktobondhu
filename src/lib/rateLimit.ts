// সহজ in-memory রেট লিমিটার। একাধিক সার্ভার instance থাকলে Redis লাগবে (README-তে সীমাবদ্ধতা হিসেবে লেখা আছে)।
type Rec = { count: number; resetAt: number };

const hits = new Map<string, Rec>();
let lastSweep = 0;

// মেয়াদ শেষ হওয়া এন্ট্রি মাঝে মাঝে মুছে ফেলা, নইলে Map শুধু বাড়তে থাকে
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  hits.forEach((rec, key) => {
    if (rec.resetAt < now) hits.delete(key);
  });
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);
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

// সফল লগইনের পর ওই key-র গণনা শূন্য করা
export function rateLimitReset(key: string) {
  hits.delete(key);
}