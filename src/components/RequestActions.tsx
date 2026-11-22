"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldError, FormMessage } from "./Toast";
import { bn, toInputDate } from "@/lib/format";
import { urgencyLabel, MAX_DAYS, MAX_UNITS, type RequestStatus, type Urgency } from "@/lib/labels";

type Props = {
  id: string;
  status: RequestStatus;
  canCancel: boolean;
  canDelete: boolean;
  defaults: { units: number; urgency: Urgency; expiresAt: string; note: string };
};

const urgencies = Object.keys(urgencyLabel) as Urgency[];

export default function RequestActions({ id, status, canCancel, canDelete, defaults }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});
  const [urgency, setUrgency] = useState<Urgency>(defaults.urgency);

  async function cancel() {
    if (busy || !window.confirm("অনুরোধটি বাতিল করবেন?")) return;
    setBusy("cancel");
    setMsg(null);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ kind: "error", text: data.error ?? "বাতিল করা যায়নি" });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: "নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন" });
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (busy || !window.confirm("অনুরোধটি চিরতরে মুছে ফেলবেন?")) return;
    setBusy("delete");
    setMsg(null);
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ kind: "error", text: data.error ?? "মোছা যায়নি" });
      router.push("/dashboard/requests");
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: "নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন" });
    } finally {
      setBusy("");
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy("edit");
    setMsg(null);
    setFieldErrs({});
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fd),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldErrs(data.fields ?? {});
        return setMsg({ kind: "error", text: data.error ?? "সংরক্ষণ করা যায়নি" });
      }
      setEditing(false);
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: "নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন" });
    } finally {
      setBusy("");
    }
  }

  const f = (k: string) => ({ "aria-invalid": !!fieldErrs[k], "aria-describedby": `${k}-err` });
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_DAYS[urgency]);

  if (!canCancel && !canDelete && status !== "PENDING") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {status === "PENDING" && (
          <button type="button" className="btn-quiet" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>
            {editing ? "সম্পাদনা বন্ধ করুন" : "সম্পাদনা করুন"}
          </button>
        )}
        {canCancel && (
          <button type="button" className="btn-quiet" disabled={!!busy} onClick={cancel}>
            {busy === "cancel" ? "বাতিল হচ্ছে..." : "অনুরোধ বাতিল করুন"}
          </button>
        )}
        {canDelete && (
          <button type="button" className="btn-quiet !border-blood/50 !text-blood-text" disabled={!!busy} onClick={remove}>
            {busy === "delete" ? "মুছছে..." : "মুছে ফেলুন"}
          </button>
        )}
      </div>

      {msg && <FormMessage kind={msg.kind}>{msg.text}</FormMessage>}

      {editing && (
        <form onSubmit={save} noValidate className="enter-up card space-y-4 rounded-lg border border-line bg-surface p-5">
          <p className="text-sm text-slate">রোগীর নাম ও রক্তের গ্রুপ বদলানো যায় না। ভুল হলে অনুরোধ বাতিল করে নতুন করে দিন।</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="e-units" className="mb-1 block font-medium">ব্যাগের সংখ্যা</label>
              <input id="e-units" name="units" type="number" defaultValue={defaults.units} className="field" {...f("units")} />
              <p className="mt-1 text-sm text-slate">সর্বোচ্চ {bn(MAX_UNITS)}টি</p>
              <FieldError id="units-err" message={fieldErrs.units} />
            </div>
            <div>
              <label htmlFor="e-urgency" className="mb-1 block font-medium">জরুরি মাত্রা</label>
              <select id="e-urgency" name="urgency" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)} className="field">
                {urgencies.map((u) => (
                  <option key={u} value={u}>{urgencyLabel[u]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="e-exp" className="mb-1 block font-medium">কবে পর্যন্ত লাগবে</label>
              <input
                id="e-exp"
                name="expiresAt"
                type="date"
                defaultValue={defaults.expiresAt}
                min={toInputDate(new Date())}
                max={toInputDate(maxDate)}
                className="field"
                {...f("expiresAt")}
              />
              <p className="mt-1 text-sm text-slate">সর্বোচ্চ {bn(MAX_DAYS[urgency])} দিন</p>
              <FieldError id="expiresAt-err" message={fieldErrs.expiresAt} />
            </div>
          </div>
          <div>
            <label htmlFor="e-note" className="mb-1 block font-medium">অতিরিক্ত তথ্য</label>
            <textarea id="e-note" name="note" rows={2} defaultValue={defaults.note} className="field" {...f("note")} />
            <FieldError id="note-err" message={fieldErrs.note} />
          </div>
          <button type="submit" className="btn" disabled={!!busy}>
            {busy === "edit" ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
          </button>
        </form>
      )}
    </div>
  );
}