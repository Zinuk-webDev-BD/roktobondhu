"use client";

import { useEffect, useState } from "react";
import CountUp from "./CountUp";

const DAY = 86400000;
const R = 52;
const C = 2 * Math.PI * R;

function parse(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
function addMonths(d: Date, m: number) {
  const x = new Date(d.getFullYear(), d.getMonth() + m, 1, 12);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(d.getDate(), last));
  return x;
}
function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function NextDonation() {
  const [last, setLast] = useState("");
  const [months, setMonths] = useState(3);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(false);
    const id = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(id);
  }, [last, months]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

  let body: React.ReactNode = <p className="text-slate">শেষ রক্তদানের তারিখ বাছুন। পরের তারিখ আর কত দিন বাকি, এখানে দেখাবে।</p>;

  if (last) {
    const lastD = parse(last);
    if (lastD.getTime() > today.getTime()) {
      body = <p className="text-warn">ভবিষ্যতের তারিখ দেওয়া যাবে না। আজকের বা আগের তারিখ বাছুন।</p>;
    } else {
      const next = addMonths(lastD, months);
      const total = Math.max(1, Math.round((next.getTime() - lastD.getTime()) / DAY));
      const elapsed = Math.round((today.getTime() - lastD.getTime()) / DAY);
      const left = Math.max(0, Math.round((next.getTime() - today.getTime()) / DAY));
      const pct = Math.min(1, Math.max(0, elapsed / total));
      const ready = left === 0;
      const dateText = new Intl.DateTimeFormat("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(next);

      body = (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(150,170,210,0.2)" strokeWidth="9" />
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={ready ? "#6EE7B7" : "#FF8A93"}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={shown ? C * (1 - pct) : C}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.2,0.7,0.2,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {ready ? (
                <p className="text-xl font-bold text-ok">আজই পারবেন</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-blood-text">
                    <CountUp value={left} />
                  </p>
                  <p className="text-sm text-slate">দিন বাকি</p>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-slate">আপনি পরের বার রক্ত দিতে পারবেন</p>
            <p className="mt-1 text-xl font-bold">{dateText} থেকে</p>
            <p className="mt-3 text-sm text-slate">
              এটি শুধু হিসাব। ব্যবধান ব্লাড ব্যাংক ও আপনার স্বাস্থ্যের ওপর নির্ভর করে, তাই দেওয়ার আগে চিকিৎসকের পরীক্ষায় পাশ করতে হবে।
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="card rounded-lg border border-line bg-surface p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-slate">শেষ রক্তদানের তারিখ</span>
          <input type="date" className="field" value={last} max={iso(today)} onChange={(e) => setLast(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-slate">দুই দানের ব্যবধান</span>
          <select className="field" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            <option value={3}>৩ মাস</option>
            <option value={4}>৪ মাস</option>
          </select>
        </label>
      </div>
      <div className="mt-6" aria-live="polite">
        {body}
      </div>
    </div>
  );
}