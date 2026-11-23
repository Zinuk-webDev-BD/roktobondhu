import Link from "next/link";
import { bn } from "@/lib/format";

const links = [
  { href: "/dashboard", label: "স্টক বোর্ড" },
  { href: "/login", label: "লগইন" },
  { href: "/register", label: "রেজিস্ট্রেশন" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="card relative mt-16 shrink-0 border-t border-line bg-surface">
      {/* হার্টবিট রেখা */}
      <svg viewBox="0 0 600 40" preserveAspectRatio="none" className="absolute inset-x-0 -top-5 h-10 w-full" aria-hidden="true">
        <path
          className="ecg"
          pathLength="100"
          d="M0 20 H210 l10 -14 l12 28 l10 -24 l8 10 H600"
          fill="none"
          stroke="#FF8A93"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 text-xl font-bold text-blood-text">
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" fill="#D12F3C" />
            </svg>
            রক্তবন্ধু
          </p>
          <p className="mt-3 max-w-xs text-slate">
            রক্তদাতা, হাসপাতাল ও ব্লাড ব্যাংককে এক জায়গায় যুক্ত করার ব্যবস্থাপনা সিস্টেম।
          </p>
        </div>

        <nav aria-label="ফুটার মেনু">
          <p className="font-semibold">দ্রুত লিংক</p>
          <ul className="mt-3 space-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block text-slate transition duration-200 hover:translate-x-1 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

                <div>
          <p className="font-semibold">কীভাবে কাজ করে</p>
          <p className="mt-3 text-slate">
            হাসপাতাল রক্তের অনুরোধ জমা দেয়। অ্যাডমিন স্টক থেকে মেয়াদ ও গ্রুপ মিলিয়ে ব্যাগ বরাদ্দ করে, আর যোগ্য দাতারা সাড়া দিতে পারেন।
          </p>
        </div>
      </div>

      <div className="border-t border-line px-6 py-4 text-center text-sm text-slate">
        © {bn(year)} রক্তবন্ধু। এটি একটি শিক্ষামূলক ডেমো প্রজেক্ট।
      </div>
    </footer>
  );
}