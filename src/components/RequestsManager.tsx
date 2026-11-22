"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FieldError, FormMessage } from "./Toast";
import { StatusBadge, UrgencyBadge } from "./StatusBadge";
import { bloodGroups, bloodGroupLabel } from "@/lib/validation";
import { bn, daysLeft, toInputDate } from "@/lib/format";
import { statusLabel, urgencyLabel, MAX_DAYS, MAX_UNITS, type RequestStatus, type Urgency } from "@/lib/labels";

type Row = {
  id: string;
  patientName: string;
  bloodGroup: (typeof bloodGroups)[number];
  units: number;
  urgency: Urgency;
  status: RequestStatus;
  hospital: string;
  district: string;
  expiresAt: string;
  _count: { offers: number };
};

const statuses = Object.keys(statusLabel) as RequestStatus[];
const urgencies = Object.keys(urgencyLabel) as Urgency[];
const sortOptions = [
  { v: "urgency:desc", l: "জরুরি আগে" },
  { v: "created:desc", l: "নতুন আগে" },
  { v: "created:asc", l: "পুরনো আগে" },
  { v: "expires:asc", l: "মেয়াদ আগে শেষ হবে এমন আগে" },
];

export default function RequestsManager({ role }: { role: "HOSPITAL" | "ADMIN" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [status, setStatus] = useState("");
  const [group, setGroup] = useState("");
  const [urgency, setUrgency] = useState("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [sortKey, setSortKey] = useState("urgency:desc");

  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});
  const [urgencySel, setUrgencySel] = useState<Urgency>("NORMAL");

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [sort, order] = sortKey.split(":");
    const p = new URLSearchParams({ sort, order });
    if (status) p.set("status", status);
    if (group) p.set("group", group);
    if (urgency) p.set("urgency", urgency);
    if (dq.trim()) p.set("q", dq.trim());
    try {
      const res = await fetch(`/api/requests?${p.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error ?? "তালিকা আনা যায়নি");
        return;
      }
      setRows(data.requests);
      setSummary(data.summary ?? {});
    } catch {
      setLoadError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  }, [status, group, urgency, dq, sortKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    setBusy(true);
    setFormError("");
    setFormOk("");
    setFieldErrs({});
    const fd = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fd),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "অনুরোধ জমা হয়নি");
        setFieldErrs(data.fields ?? {});
        return;
      }
      setFormOk("অনুরোধ জমা হয়েছে");
      form.reset();
      setUrgencySel("NORMAL");
      await load();
    } catch {
      setFormError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  }

  const f = (k: string) => ({ "aria-invalid": !!fieldErrs[k], "aria-describedby": `${k}-err` });
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_DAYS[urgencySel]);
  const total = statuses.reduce((s, k) => s + (summary[k] ?? 0), 0);
  const filtered = !!(status || group || urgency || dq.trim());

  const deadline = (r: Row) => {
    if (r.status !== "PENDING" && r.status !== "MATCHED") return "";
    const d = daysLeft(r.expiresAt);
    return d > 0 ? `${bn(d)} দিন বাকি` : "আজ শেষ";
  };

  return (
    <div className="mt-8 space-y-8">
      {role === "HOSPITAL" && (
        <section aria-labelledby="new-title" className="card rounded-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="new-title" className="text-xl font-semibold">
              নতুন রক্তের অনুরোধ
            </h2>
            <button type="button" className="btn-quiet" aria-expanded={formOpen} onClick={() => setFormOpen((v) => !v)}>
              {formOpen ? "ফর্ম বন্ধ করুন" : "অনুরোধ তৈরি করুন"}
            </button>
          </div>

          {formOpen && (
            <form onSubmit={onCreate} noValidate className="enter-up mt-5 space-y-4">
              <FormMessage kind="error">{formError}</FormMessage>
              <FormMessage kind="ok">{formOk}</FormMessage>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="patientName" className="mb-1 block font-medium">রোগীর নাম</label>
                  <input id="patientName" name="patientName" className="field" {...f("patientName")} />
                  <FieldError id="patientName-err" message={fieldErrs.patientName} />
                </div>
                <div>
                  <label htmlFor="district" className="mb-1 block font-medium">জেলা</label>
                  <input id="district" name="district" className="field" {...f("district")} />
                  <FieldError id="district-err" message={fieldErrs.district} />
                </div>
                <div>
                  <label htmlFor="bloodGroup" className="mb-1 block font-medium">রক্তের গ্রুপ</label>
                  <select id="bloodGroup" name="bloodGroup" defaultValue="" className="field" {...f("bloodGroup")}>
                    <option value="" disabled>বেছে নিন</option>
                    {bloodGroups.map((g) => (
                      <option key={g} value={g}>{bloodGroupLabel[g]}</option>
                    ))}
                  </select>
                  <FieldError id="bloodGroup-err" message={fieldErrs.bloodGroup} />
                </div>
                <div>
                  <label htmlFor="units" className="mb-1 block font-medium">কয় ব্যাগ লাগবে</label>
                  <input id="units" name="units" type="number" inputMode="numeric" defaultValue={1} className="field" {...f("units")} />
                  <p className="mt-1 text-sm text-slate">একবারে সর্বোচ্চ {bn(MAX_UNITS)}টি</p>
                  <FieldError id="units-err" message={fieldErrs.units} />
                </div>
                <div>
                  <label htmlFor="urgency" className="mb-1 block font-medium">জরুরি মাত্রা</label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={urgencySel}
                    onChange={(e) => setUrgencySel(e.target.value as Urgency)}
                    className="field"
                    {...f("urgency")}
                  >
                    {urgencies.map((u) => (
                      <option key={u} value={u}>{urgencyLabel[u]}</option>
                    ))}
                  </select>
                  <FieldError id="urgency-err" message={fieldErrs.urgency} />
                </div>
                <div>
                  <label htmlFor="expiresAt" className="mb-1 block font-medium">কবে পর্যন্ত রক্ত লাগবে</label>
                  <input
                    id="expiresAt"
                    name="expiresAt"
                    type="date"
                    min={toInputDate(today)}
                    max={toInputDate(maxDate)}
                    className="field"
                    {...f("expiresAt")}
                  />
                  <p className="mt-1 text-sm text-slate">
                    {urgencyLabel[urgencySel]} অনুরোধের মেয়াদ সর্বোচ্চ {bn(MAX_DAYS[urgencySel])} দিন
                  </p>
                  <FieldError id="expiresAt-err" message={fieldErrs.expiresAt} />
                </div>
              </div>
              <div>
                <label htmlFor="note" className="mb-1 block font-medium">অতিরিক্ত তথ্য (ঐচ্ছিক)</label>
                <textarea id="note" name="note" rows={2} className="field" {...f("note")} />
                <FieldError id="note-err" message={fieldErrs.note} />
              </div>
              <button type="submit" disabled={busy} className="btn">
                {busy ? "জমা হচ্ছে..." : "অনুরোধ জমা দিন"}
              </button>
            </form>
          )}
        </section>
      )}

      <section aria-labelledby="list-title">
        <h2 id="list-title" className="text-xl font-semibold">
          {role === "ADMIN" ? "সব অনুরোধ" : "আমার অনুরোধ"}
        </h2>

        {/* অবস্থা অনুযায়ী সংখ্যা */}
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="অবস্থা অনুযায়ী ফিল্টার">
          <button
            type="button"
            aria-pressed={status === ""}
            onClick={() => setStatus("")}
            className={`rounded-full border px-4 py-1.5 transition-colors ${status === "" ? "border-blood bg-blood text-white" : "border-line text-slate hover:text-ink"}`}
          >
            সব ({bn(total)})
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(status === s ? "" : s)}
              className={`rounded-full border px-4 py-1.5 transition-colors ${status === s ? "border-blood bg-blood text-white" : "border-line text-slate hover:text-ink"}`}
            >
              {statusLabel[s]} ({bn(summary[s] ?? 0)})
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="f-q" className="mb-1 block text-sm font-medium">খুঁজুন</label>
            <input id="f-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="রোগী, হাসপাতাল বা জেলা" className="field" />
          </div>
          <div>
            <label htmlFor="f-group" className="mb-1 block text-sm font-medium">রক্তের গ্রুপ</label>
            <select id="f-group" value={group} onChange={(e) => setGroup(e.target.value)} className="field">
              <option value="">সব গ্রুপ</option>
              {bloodGroups.map((g) => (
                <option key={g} value={g}>{bloodGroupLabel[g]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-urgency" className="mb-1 block text-sm font-medium">জরুরি মাত্রা</label>
            <select id="f-urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)} className="field">
              <option value="">সব মাত্রা</option>
              {urgencies.map((u) => (
                <option key={u} value={u}>{urgencyLabel[u]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-sort" className="mb-1 block text-sm font-medium">সাজানোর নিয়ম</label>
            <select id="f-sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="field">
              {sortOptions.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <FormMessage kind="error">{loadError}</FormMessage>
          <p aria-live="polite" className="text-sm text-slate">
            {loading ? "লোড হচ্ছে..." : `${bn(rows.length)}টি অনুরোধ পাওয়া গেছে`}
          </p>
        </div>

        {loading && rows.length === 0 && (
          <div className="mt-3 space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border border-line bg-surface" />
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && !loadError && (
          <div className="mt-3 rounded-lg border border-dashed border-line px-5 py-10 text-center text-slate">
            {filtered
              ? "এই ফিল্টারে কোনো অনুরোধ নেই। ফিল্টার বদলান।"
              : role === "HOSPITAL"
              ? "এখনো কোনো অনুরোধ নেই। ওপরের বোতাম থেকে প্রথম অনুরোধটি তৈরি করুন।"
              : "এখনো কোনো অনুরোধ জমা পড়েনি।"}
          </div>
        )}

        <ul className="mt-3 space-y-3">
          {rows.map((r, i) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/requests/${r.id}`}
                className="card enter-up flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface p-4"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blood-soft text-xl font-bold text-blood-text">
                  {bloodGroupLabel[r.bloodGroup]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">{r.patientName}</span>
                  <span className="block text-slate">
                    {bn(r.units)}টি ব্যাগ, {r.district}
                    {role === "ADMIN" ? `, ${r.hospital}` : ""}
                  </span>
                  <span className="mt-1 block text-sm text-slate">
                    {deadline(r)}
                    {r._count.offers > 0 && `${deadline(r) ? ", " : ""}${bn(r._count.offers)}জন দাতা সাড়া দিয়েছেন`}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <UrgencyBadge urgency={r.urgency} />
                  <StatusBadge status={r.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}