"use client";

import { useState } from "react";
import CountUp from "./CountUp";
import { FormMessage } from "./Toast";
import { bn } from "@/lib/format";

type RaceItem = { n: number; ok: boolean; reason?: string };
type RaceResult = { mode: "race"; total: number; success: number; failed: number; allocationsForBag: number; ms: number; items: RaceItem[] };
type IdemResult = { mode: "idempotency"; calls: { ok: boolean; replayed: boolean; reason?: string }[]; allocationsForRequest: number };

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="card rounded-lg border border-line bg-surface p-4 text-center">
      <p className={`text-3xl font-bold ${tone}`}>
        <CountUp value={value} />
      </p>
      <p className="mt-1 text-sm text-slate">{label}</p>
    </div>
  );
}

export default function RaceDemo() {
  const [busy, setBusy] = useState<"" | "race" | "idempotency">("");
  const [error, setError] = useState("");
  const [race, setRace] = useState<RaceResult | null>(null);
  const [idem, setIdem] = useState<IdemResult | null>(null);

  async function run(mode: "race" | "idempotency") {
    if (busy) return;
    setBusy(mode);
    setError("");
    if (mode === "race") setRace(null);
    else setIdem(null);
    try {
      const res = await fetch("/api/admin/race-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "ডেমো চালানো যায়নি");
      if (mode === "race") setRace(data);
      else setIdem(data);
    } catch {
      setError("নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-8 space-y-10">
      <FormMessage kind="error">{error}</FormMessage>

      {/* ডেমো ১: একযোগে ১০ অনুরোধ */}
      <section className="card rounded-lg border border-line bg-surface p-5 sm:p-6" aria-labelledby="race-title">
        <h2 id="race-title" className="text-2xl font-bold">
          ১. শেষ ব্যাগের জন্য ১০টি অনুরোধ একসঙ্গে
        </h2>
        <p className="mt-2 max-w-2xl text-slate">
          স্টকে মাত্র ১টি O- ব্যাগ। ১০টি হাসপাতাল একই মুহূর্তে সেটা চাইছে। সঠিক সিস্টেমে ঠিক একজন পাবে, বাকিরা &ldquo;ব্যাগ আর নেই&rdquo; শুনবে, আর কোনো ব্যাগ দুইবার বরাদ্দ হবে না।        </p>
        <button type="button" className="btn mt-5" disabled={!!busy} onClick={() => run("race")}>
          {busy === "race" ? "চলছে..." : "১০টি অনুরোধ একসঙ্গে ছাড়ুন"}
        </button>

        {race && (
          <div className="mt-6">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {race.items.map((it, i) => (
                <li
                  key={it.n}
                  className={`enter-zoom rounded-lg border p-3 text-center ${it.ok ? "border-ok/50 bg-ok-soft" : "border-line bg-raised"}`}
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <p className="text-sm text-slate">অনুরোধ {bn(it.n)}</p>
                  <p className={`mt-1 font-bold ${it.ok ? "text-ok" : "text-blood-text"}`}>{it.ok ? "✓ ব্যাগ পেয়েছে" : "✕ ব্যাগ আর নেই"}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat value={race.total} label="মোট অনুরোধ" tone="text-ink" />
              <Stat value={race.success} label="সফল" tone="text-ok" />
              <Stat value={race.failed} label="ব্যর্থ" tone="text-blood-text" />
              <Stat value={race.allocationsForBag} label="এই ব্যাগের বরাদ্দ রেকর্ড" tone={race.allocationsForBag === 1 ? "text-ok" : "text-blood-text"} />
            </div>
            <p className="mt-4">
              {race.allocationsForBag === 1 ? (
                <span className="text-ok">✓ ব্যাগটি ঠিক একবারই বরাদ্দ হয়েছে। দুইবার বরাদ্দ হওয়ার কোনো সুযোগ নেই।</span>
              ) : (
                <span className="text-blood-text">✕ অস্বাভাবিক ফল: ব্যাগের বরাদ্দ সংখ্যা ১ নয়।</span>
              )}{" "}
              <span className="text-sm text-slate">(সময় লেগেছে প্রায় {bn(race.ms)} মিলিসেকেন্ড)</span>
            </p>
          </div>
        )}
      </section>

      {/* ডেমো ২: idempotency */}
      <section className="card rounded-lg border border-line bg-surface p-5 sm:p-6" aria-labelledby="idem-title">
        <h2 id="idem-title" className="text-2xl font-bold">
          ২. ডাবল ক্লিক বা নেটওয়ার্ক retry
        </h2>
        <p className="mt-2 max-w-2xl text-slate">
          একই অনুরোধ একই idempotency key দিয়ে তিনবার একসঙ্গে পাঠানো হবে। ব্যাগ একবারই বরাদ্দ হবে, বাকি দুইবারে আগের ফলই ফেরত আসবে।
        </p>
        <button type="button" className="btn mt-5" disabled={!!busy} onClick={() => run("idempotency")}>
          {busy === "idempotency" ? "চলছে..." : "একই key-তে ৩ বার পাঠান"}
        </button>

        {idem && (
          <div className="mt-6">
            <ul className="grid gap-3 sm:grid-cols-3">
              {idem.calls.map((c, i) => (
                <li key={i} className="enter-up rounded-lg border border-line bg-raised p-4 text-center" style={{ animationDelay: `${i * 120}ms` }}>
                  <p className="text-sm text-slate">পাঠানো {bn(i + 1)}</p>
                  <p className={`mt-1 font-bold ${!c.ok ? "text-blood-text" : c.replayed ? "text-warn" : "text-ok"}`}>
                    {!c.ok ? "✕ ব্যর্থ" : c.replayed ? "↻ আগের ফল ফেরত" : "✓ নতুন বরাদ্দ"}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              {idem.allocationsForRequest === 1 ? (
                <span className="text-ok">✓ তিনবার পাঠানোর পরও বরাদ্দ রেকর্ড মাত্র ১টি।</span>
              ) : (
                <span className="text-blood-text">✕ অস্বাভাবিক ফল: বরাদ্দ রেকর্ড {bn(idem.allocationsForRequest)}টি।</span>
              )}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}