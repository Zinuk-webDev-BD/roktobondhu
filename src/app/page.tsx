import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { expireOldBags } from "@/lib/stock";
import { expireOldRequests } from "@/lib/requests";
import { bn } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getCounts() {
  try {
    await Promise.all([expireOldBags(), expireOldRequests()]);
    const [bags, requests, donors] = await Promise.all([
      db.bloodBag.count({ where: { status: "AVAILABLE" } }),
      db.bloodRequest.count({ where: { status: { in: ["PENDING", "MATCHED"] } } }),
      db.donorProfile.count(),
    ]);
    return { bags, requests, donors };
  } catch {
    return null; // ডাটাবেস না পেলেও হোম পেজ খুলবে
  }
}

const roles = [
  { title: "হাসপাতাল", text: "রোগীর জন্য রক্তের অনুরোধ জানায়। অবস্থা দেখে, সাড়া দেওয়া দাতার সঙ্গে যোগাযোগ করে।" },
  { title: "রক্তদাতা", text: "নিজের গ্রুপের জরুরি অনুরোধ দেখে সাড়া দেয়। যোগ্যতার নিয়ম সিস্টেম নিজেই যাচাই করে।" },
  { title: "অ্যাডমিন", text: "ব্লাড ব্যাংকের স্টক সামলায়, ব্যাগ বরাদ্দ করে। একই ব্যাগ কখনো দুজনকে দেয় না।" },
];

export default async function Home() {
  const user = await getCurrentUser().catch(() => null);
  const counts = await getCounts();

  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
      <p className="enter-left flex items-center gap-2 text-xl font-semibold text-blood-text">
        <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true">
          <path d="M9 1C9 1 1.5 9.5 1.5 14a7.5 7.5 0 0 0 15 0C16.5 9.5 9 1 9 1z" fill="#C62A36" />
        </svg>
        রক্তবন্ধু
      </p>

      <h1 className="enter-zoom mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl" style={{ animationDelay: "100ms" }}>
        রাত তিনটায় O- রক্ত লাগলে ফেসবুক পোস্টের জন্য অপেক্ষা করতে হবে না
      </h1>

      <p className="enter-right mt-5 max-w-2xl text-lg text-slate" style={{ animationDelay: "220ms" }}>
        হাসপাতাল অনুরোধ জানায়, সিস্টেম গ্রুপ ও মেয়াদ মিলিয়ে ব্লাড ব্যাংকের ব্যাগ বরাদ্দ করে এবং যোগ্য দাতাদের খবর দেয়। একই ব্যাগ কখনো দুই রোগীর নামে যায় না।
      </p>

      <div className="enter-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "340ms" }}>
        {user ? (
          <Link href="/dashboard" className="btn">ড্যাশবোর্ডে যান</Link>
        ) : (
          <>
            <Link href="/login" className="btn">লগইন করুন</Link>
            <Link href="/register" className="btn-quiet">দাতা বা হাসপাতাল হিসেবে যোগ দিন</Link>          </>
        )}
      </div>

      {counts && (
        <section aria-label="এখনকার অবস্থা" className="enter-up mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3" style={{ animationDelay: "460ms" }}>
          {[
            { n: counts.bags, l: "ব্যাগ এখন প্রস্তুত" },
            { n: counts.requests, l: "খোলা রক্তের অনুরোধ" },
            { n: counts.donors, l: "নিবন্ধিত রক্তদাতা" },
          ].map((s) => (
            <div key={s.l} className="card rounded-lg border border-line bg-surface p-5 text-center">
              <p className="text-4xl font-bold text-blood-text">{bn(s.n)}</p>
              <p className="mt-1 text-slate">{s.l}</p>
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="who-title" className="mt-16">
        <h2 id="who-title" className="text-2xl font-bold">কে কী করে</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {roles.map((r, i) => (
            <li key={r.title} className="card enter-up rounded-lg border border-line border-t-2 border-t-blood bg-surface p-5" style={{ animationDelay: `${i * 90}ms` }}>
              <p className="text-lg font-bold">{r.title}</p>
              <p className="mt-2 text-slate">{r.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}