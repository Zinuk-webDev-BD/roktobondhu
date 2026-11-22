"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "./Toast";

export default function AllocationActions({ id, status, role }: { id: string; status: string; role: string }) {
  const router = useRouter();
  const keyRef = useRef<string | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const canAllocate = role === "ADMIN" && status === "PENDING";
  const canFulfill = status === "MATCHED" && (role === "ADMIN" || role === "HOSPITAL");

  async function allocate() {
    if (busy) return;
    setBusy("allocate");
    setMsg(null);
    // নেটওয়ার্ক ভেঙে গেলে একই key-তে আবার চাপলে বরাদ্দ দুইবার হবে না
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    try {
      const res = await fetch(`/api/requests/${id}/allocate`, { method: "POST", headers: { "Idempotency-Key": keyRef.current } });
      const data = await res.json().catch(() => ({}));
      keyRef.current = null; // সার্ভার স্পষ্ট উত্তর দিয়েছে, পরের চেষ্টায় নতুন key
      if (!res.ok) {
        const hint = data.code === "INSUFFICIENT" ? " ব্যাগ ব্যবস্থাপনা থেকে নতুন ব্যাগ যোগ করুন।" : "";
        setMsg({ kind: "error", text: `${data.error ?? "বরাদ্দ করা যায়নি"}${hint}` });
        return;
      }
      setMsg({ kind: "ok", text: data.replayed ? "এই বরাদ্দ আগেই হয়েছিল, আগের ফলই দেখানো হচ্ছে" : "ব্যাগ বরাদ্দ হয়েছে" });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: "নেটওয়ার্কে সমস্যা। আবার চাপুন, বরাদ্দ দুইবার হবে না" });
    } finally {
      setBusy("");
    }
  }

  async function fulfill() {
    if (busy || !window.confirm("রক্ত পৌঁছে গেছে? অনুরোধটি সম্পন্ন করবেন?")) return;
    setBusy("fulfill");
    setMsg(null);
    try {
      const res = await fetch(`/api/requests/${id}/fulfill`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ kind: "error", text: data.error ?? "সম্পন্ন করা যায়নি" });
      setMsg({ kind: "ok", text: "অনুরোধ সম্পন্ন হয়েছে" });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: "নেটওয়ার্কে সমস্যা। আবার চেষ্টা করুন" });
    } finally {
      setBusy("");
    }
  }

  if (!canAllocate && !canFulfill && !msg) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {canAllocate && (
          <button type="button" className="btn" disabled={!!busy} onClick={allocate}>
            {busy === "allocate" ? "বরাদ্দ হচ্ছে..." : "ব্যাগ বরাদ্দ করুন"}
          </button>
        )}
        {canFulfill && (
          <button type="button" className="btn" disabled={!!busy} onClick={fulfill}>
            {busy === "fulfill" ? "সম্পন্ন হচ্ছে..." : "রক্ত পৌঁছেছে, সম্পন্ন করুন"}
          </button>
        )}
      </div>
      {msg && <FormMessage kind={msg.kind}>{msg.text}</FormMessage>}
    </div>
  );
}