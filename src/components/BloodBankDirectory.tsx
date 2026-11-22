"use client";

import { useState } from "react";
import { bloodBanks } from "@/lib/bloodBanks";

const toBn = (s: string) => s.replace(/\d/g, (c) => "০১২৩৪৫৬৭৮৯"[Number(c)]);
const districts = ["সব জেলা", ...Array.from(new Set(bloodBanks.map((b) => b.district)))];

export default function BloodBankDirectory() {
  const [district, setDistrict] = useState("সব জেলা");
  const list = district === "সব জেলা" ? bloodBanks : bloodBanks.filter((b) => b.district === district);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="জেলা বাছাই">
        {districts.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={district === d}
            onClick={() => setDistrict(d)}
            className={`rounded-full border px-4 py-1.5 transition duration-200 hover:-translate-y-0.5 ${
              district === d ? "border-blood bg-blood text-white shadow-lg shadow-blood/30" : "border-line text-slate hover:border-blood-text hover:text-ink"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {list.map((b, i) => (
          <li
            key={`${district}-${b.name}`}
            className="enter-up card rounded-lg border border-line bg-surface p-5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="rounded-full bg-blood-soft px-3 py-0.5 text-sm text-blood-text">{b.district}</span>
            <p className="mt-3 text-lg font-bold">{b.name}</p>
            <p className="mt-1 text-slate">{b.address}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {b.phones.map((p) => (
                <a
                  key={p.number}
                  href={`tel:${p.number}`}
                  className="btn-quiet gap-2 text-sm"
                  aria-label={`${b.name}: ${p.label}, ${toBn(p.number)} নম্বরে ফোন করুন`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11 11 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.2.2 2.4.56 3.5a1 1 0 01-.25 1z"
                    />
                  </svg>
                  <span>
                    {p.label}: {toBn(p.number)}
                  </span>
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-slate">
        উৎস: বাংলাদেশ রেড ক্রিসেন্ট সোসাইটির ওয়েবসাইট। নম্বর বদলে যেতে পারে, তাই যাওয়ার আগে ফোন করে রক্ত বা প্লাটিলেটের প্রাপ্যতা জেনে নিন।
      </p>
    </div>
  );
}