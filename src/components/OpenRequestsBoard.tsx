"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormMessage } from "./Toast";
import { UrgencyBadge } from "./StatusBadge";
import { bloodGroupLabel, type bloodGroups } from "@/lib/validation";
import { bn, daysLeft } from "@/lib/format";
import type { Urgency } from "@/lib/labels";

type Row = {
  id: string;
  bloodGroup: (typeof bloodGroups)[number];
  units: number;
  urgency: Urgency;
  hospital: string;
  district: string;
  expiresAt: string;
  offered: boolean;
};

export default function OpenRequestsBoard({ eligible, reasons, groupLabel }: { eligible: boolean; reasons: string[]; groupLabel: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, { kind: "error" | "ok"; text: string }>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/requests?sort=urgency&order=desc");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setLoadError(data.error ?? "তালিকা আনা যায়নি");
          return;
        }
        setRows(data.requests);
      } catch {
        setLoadError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function offer(id: string) {
    if (busyId) return;
    setBusyId(id);
    setMsgs((m) => ({ ...m, [id]: undefined as never }));
    try {
      const res = await fetch(`/api/requests/${id}/offers`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status === 409) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, offered: res.ok || data.error?.includes("আগেই") ? true : r.offered } : r)));
      }
      setMsgs((m) => ({
        ...m,
        [id]: res.ok ? { kind: "ok", text: "ধন্যবাদ। হাসপাতাল আপনার ফোন নম্বর দেখতে পাবে।" } : { kind: "error", text: data.error ?? "সাড়া পাঠানো যায়নি" },
      }));
    } catch {
      setMsgs((m) => ({ ...m, [id]: { kind: "error", text: "নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন" } }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {!eligible && (
        <div role="status" className="rounded-lg border border-warn/40 bg-warn-soft p-5">
          <p className="font-bold text-warn">এই মুহূর্তে আপনি সাড়া দিতে পারছেন না</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {reasons.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Link href="/dashboard/profile" className="mt-3 inline-block underline">প্রোফাইল দেখুন</Link>
        </div>
      )}

      <p className="text-slate">
        আপনার গ্রুপ ({groupLabel}) যে রোগীদের রক্ত দিতে পারে, শুধু তাদের খোলা অনুরোধ এখানে দেখাচ্ছে। রোগীর গোপনীয়তার জন্য নাম দেখানো হয় না।
      </p>

      <FormMessage kind="error">{loadError}</FormMessage>

      {loading && (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-line bg-surface" />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && !loadError && (
        <div className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-slate">
          এখন আপনার গ্রুপের জন্য কোনো খোলা অনুরোধ নেই। নতুন অনুরোধ এলে এখানে দেখা যাবে।
        </div>
      )}

      <ul className="space-y-3">
        {rows.map((r, i) => {
          const left = daysLeft(r.expiresAt);
          const msg = msgs[r.id];
          return (
            <li
              key={r.id}
              className="card enter-up rounded-lg border border-line bg-surface p-4"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blood-soft text-xl font-bold text-blood-text">
                  {bloodGroupLabel[r.bloodGroup]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{r.hospital}</p>
                  <p className="text-slate">
                    {r.district}, {bn(r.units)}টি ব্যাগ, {left > 0 ? `${bn(left)} দিন বাকি` : "আজ শেষ"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <UrgencyBadge urgency={r.urgency} />
                  {r.offered ? (
                    <span className="rounded bg-ok-soft px-3 py-1 text-sm text-ok">✓ সাড়া দেওয়া হয়েছে</span>
                  ) : (
                    <button type="button" className="btn !py-1.5" disabled={!eligible || busyId === r.id} onClick={() => offer(r.id)}>
                      {busyId === r.id ? "পাঠানো হচ্ছে..." : "সাড়া দিন"}
                    </button>
                  )}
                </div>
              </div>
              {msg && (
                <div className="mt-3">
                  <FormMessage kind={msg.kind}>{msg.text}</FormMessage>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}