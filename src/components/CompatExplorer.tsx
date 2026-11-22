"use client";

import { useState } from "react";
import { bn } from "@/lib/format";

// কোন গ্রুপের দাতা কোন কোন গ্রুপের রোগীকে রক্ত দিতে পারে
const GIVE: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};
const ORDER = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const norm = (s: string) => s.replace("−", "-");

type Group = { label: string; available: number };

export default function CompatExplorer({ groups }: { groups: Group[] }) {
  const [sel, setSel] = useState("B+");
  const [mode, setMode] = useState<"receive" | "give">("receive");

  const stock = new Map(groups.map((g) => [norm(g.label), g.available]));
  const list = mode === "give" ? GIVE[sel] : ORDER.filter((g) => GIVE[g].includes(sel));
  const total = list.reduce((sum, g) => sum + (stock.get(g) ?? 0), 0);

  return (
    <div className="card rounded-lg border border-line bg-surface p-5 sm:p-6">
      {/* মোড বাছাই */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="মোড বাছাই">
        {[
          { key: "receive", label: "এই গ্রুপের রোগী কার রক্ত নিতে পারেন" },
          { key: "give", label: "এই গ্রুপের দাতা কাকে রক্ত দিতে পারেন" },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            aria-pressed={mode === m.key}
            onClick={() => setMode(m.key as "receive" | "give")}
            className={`rounded-md border px-4 py-2 transition duration-200 ${
              mode === m.key ? "border-blood bg-blood text-white" : "border-line text-slate hover:border-blood-text hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* গ্রুপ বাছাই */}
      <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-8" role="group" aria-label="রক্তের গ্রুপ বাছাই">
        {ORDER.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={sel === g}
            onClick={() => setSel(g)}
            className={`rounded-md border py-3 text-lg font-bold transition duration-200 hover:-translate-y-0.5 ${
              sel === g ? "border-blood bg-blood text-white shadow-lg shadow-blood/30" : "border-line bg-raised text-ink hover:border-blood-text"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* ফল */}
      <p className="mt-6 text-lg">
        {mode === "receive"
          ? `${sel} গ্রুপের রোগী এই গ্রুপগুলোর রক্ত নিতে পারেন:`
          : `${sel} গ্রুপের দাতা এই গ্রুপের রোগীদের রক্ত দিতে পারেন:`}
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {list.map((g, i) => {
          const n = stock.get(g) ?? 0;
          return (
            <li
              key={`${mode}-${sel}-${g}`}
              className="enter-zoom rounded-md border border-line bg-raised px-2 py-3 text-center"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-xl font-bold">{g}</p>
              <p className={`text-sm ${n === 0 ? "text-blood-text" : n <= 2 ? "text-warn" : "text-ok"}`}>
                {n === 0 ? "স্টক নেই" : `${bn(n)}টি ব্যাগ`}
              </p>
            </li>
          );
        })}
      </ul>

      {mode === "receive" && (
        <p className="mt-4">
          স্টকে এখন এই রোগীর জন্য মোট <strong className="text-blood-text">{bn(total)}টি</strong> উপযুক্ত ব্যাগ আছে।
        </p>
      )}
      {sel === "O-" && mode === "give" && <p className="mt-2 text-slate">O- সর্বজনীন দাতা, জরুরি অবস্থায় যেকোনো গ্রুপের রোগীকে দেওয়া যায়।</p>}
      {sel === "AB+" && mode === "receive" && <p className="mt-2 text-slate">AB+ সর্বজনীন গ্রহীতা, সব গ্রুপের রক্ত নিতে পারেন।</p>}
    </div>
  );
}