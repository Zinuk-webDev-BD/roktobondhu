"use client";

import { useCallback, useEffect, useState } from "react";
import { FieldError, FormMessage } from "./Toast";
import { bloodGroups, bloodGroupLabel } from "@/lib/validation";
import { bn, daysLeft, fmtDate } from "@/lib/format";

type Status = "AVAILABLE" | "RESERVED" | "USED" | "EXPIRED";
type Bag = {
  id: string;
  bloodGroup: (typeof bloodGroups)[number];
  status: Status;
  expiryDate: string;
  createdAt: string;
};

const statusLabel: Record<Status, string> = {
  AVAILABLE: "প্রস্তুত",
  RESERVED: "বরাদ্দ",
  USED: "ব্যবহৃত",
  EXPIRED: "মেয়াদোত্তীর্ণ",
};
const statusStyle: Record<Status, string> = {
  AVAILABLE: "bg-green-50 text-ok",
  RESERVED: "bg-amber-50 text-amber-800",
  USED: "bg-paper text-slate",
  EXPIRED: "bg-blood-soft text-blood-dark",
};
const sortOptions = [
  { v: "expiry:asc", l: "মেয়াদ আগে শেষ হবে এমন আগে" },
  { v: "expiry:desc", l: "মেয়াদ পরে শেষ হবে এমন আগে" },
  { v: "created:desc", l: "নতুন যোগ হওয়া আগে" },
  { v: "created:asc", l: "পুরনো যোগ হওয়া আগে" },
];

export default function StockManager() {
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState("expiry:asc");

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});
  const [note, setNote] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [sort, order] = sortKey.split(":");
    const p = new URLSearchParams({ sort, order });
    if (group) p.set("group", group);
    if (status) p.set("status", status);
    try {
      const res = await fetch(`/api/bags?${p.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadError(data.error ?? "তালিকা আনা যায়নি");
        return;
      }
      setBags(data.bags);
    } catch {
      setLoadError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  }, [group, status, sortKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    setBusy(true);
    setFormError("");
    setFormOk("");
    setFieldErrs({});
    const fd = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/bags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fd),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "ব্যাগ যোগ করা যায়নি");
        setFieldErrs(data.fields ?? {});
        return;
      }
      setFormOk(`${bn(data.created)}টি ব্যাগ যোগ হয়েছে`);
      form.reset();
      await load();
    } catch {
      setFormError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("ব্যাগটি মুছে ফেলবেন?")) return;
    setDeletingId(id);
    setNote(null);
    try {
      const res = await fetch(`/api/bags/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      setNote(res.ok ? { kind: "ok", text: "ব্যাগ মোছা হয়েছে" } : { kind: "error", text: data.error ?? "ব্যাগ মোছা যায়নি" });
      await load();
    } catch {
      setNote({ kind: "error", text: "নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন" });
    } finally {
      setDeletingId(null);
    }
  }

  const f = (k: string) => ({ "aria-invalid": !!fieldErrs[k], "aria-describedby": `${k}-err` });

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="add-title" className="rounded-lg border border-line bg-white p-5">
        <h2 id="add-title" className="text-xl font-semibold">নতুন ব্যাগ যোগ করুন</h2>
        <form onSubmit={onAdd} noValidate className="mt-4 space-y-4">
          <FormMessage kind="error">{formError}</FormMessage>
          <FormMessage kind="ok">{formOk}</FormMessage>
          <div className="grid gap-4 sm:grid-cols-3">
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
              <label htmlFor="quantity" className="mb-1 block font-medium">ব্যাগের সংখ্যা</label>
              <input id="quantity" name="quantity" type="number" inputMode="numeric" defaultValue={1} className="field" {...f("quantity")} />
              <FieldError id="quantity-err" message={fieldErrs.quantity} />
            </div>
            <div>
              <label htmlFor="expiryDate" className="mb-1 block font-medium">মেয়াদ শেষের তারিখ</label>
              <input id="expiryDate" name="expiryDate" type="date" className="field" {...f("expiryDate")} />
              <p className="mt-1 text-sm text-slate">আজ থেকে সর্বোচ্চ ৪২ দিনের মধ্যে</p>
              <FieldError id="expiryDate-err" message={fieldErrs.expiryDate} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn">
            {busy ? "যোগ হচ্ছে..." : "ব্যাগ যোগ করুন"}
          </button>
        </form>
      </section>

      <section aria-labelledby="list-title">
        <h2 id="list-title" className="text-xl font-semibold">ব্যাগের তালিকা</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
            <label htmlFor="f-status" className="mb-1 block text-sm font-medium">অবস্থা</label>
            <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)} className="field">
              <option value="">সব অবস্থা</option>
              {(Object.keys(statusLabel) as Status[]).map((s) => (
                <option key={s} value={s}>{statusLabel[s]}</option>
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
          {note && <FormMessage kind={note.kind}>{note.text}</FormMessage>}
          <p aria-live="polite" className="text-sm text-slate">
            {loading ? "লোড হচ্ছে..." : `${bn(bags.length)}টি ব্যাগ পাওয়া গেছে`}
          </p>
        </div>

        <div className="mt-2 overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[34rem] text-left">
            <caption className="sr-only">রক্তের ব্যাগের তালিকা</caption>
            <thead className="border-b border-line bg-paper text-sm text-slate">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">গ্রুপ</th>
                <th scope="col" className="px-4 py-2 font-medium">অবস্থা</th>
                <th scope="col" className="px-4 py-2 font-medium">মেয়াদ শেষ</th>
                <th scope="col" className="px-4 py-2 font-medium"><span className="sr-only">কাজ</span></th>
              </tr>
            </thead>
            <tbody>
              {!loading && bags.length === 0 && !loadError && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate">
                    কোনো ব্যাগ পাওয়া যায়নি। ফিল্টার বদলান অথবা ওপরের ফর্ম থেকে ব্যাগ যোগ করুন।
                  </td>
                </tr>
              )}
              {bags.map((b) => {
                const left = daysLeft(b.expiryDate);
                return (
                  <tr key={b.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold">{bloodGroupLabel[b.bloodGroup]}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-sm ${statusStyle[b.status]}`}>{statusLabel[b.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      {fmtDate(b.expiryDate)}
                      {b.status === "AVAILABLE" && (
                        <span className="ml-2 text-sm text-slate">
                          {left > 0 ? `(${bn(left)} দিন বাকি)` : "(আজ শেষ)"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.status === "AVAILABLE" && (
                        <button
                          type="button"
                          className="btn-quiet !px-3 !py-1 text-sm"
                          disabled={deletingId === b.id}
                          aria-label={`${bloodGroupLabel[b.bloodGroup]} গ্রুপের ব্যাগ মুছুন`}
                          onClick={() => onDelete(b.id)}
                        >
                          {deletingId === b.id ? "মুছছে..." : "মুছুন"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}