"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldError, FormMessage } from "./Toast";
import { toInputDate } from "@/lib/format";

type Props = {
  defaults: { weightKg: number; district: string; phone: string; lastDonationDate: string; isAvailable: boolean };
};

export default function ProfileForm({ defaults }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setOk("");
    setFieldErrs({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      weightKg: fd.get("weightKg"),
      district: fd.get("district"),
      phone: fd.get("phone"),
      lastDonationDate: fd.get("lastDonationDate") || "",
      isAvailable: fd.get("isAvailable") === "on",
    };
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "সংরক্ষণ করা যায়নি");
        setFieldErrs(data.fields ?? {});
        return;
      }
      setOk("প্রোফাইল সংরক্ষণ হয়েছে");
      router.refresh();
    } catch {
      setError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  }

  const f = (k: string) => ({ "aria-invalid": !!fieldErrs[k], "aria-describedby": `${k}-err` });

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-4 rounded-lg border border-line bg-surface p-5">
      <FormMessage kind="error">{error}</FormMessage>
      <FormMessage kind="ok">{ok}</FormMessage>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="weightKg" className="mb-1 block font-medium">ওজন (কেজি)</label>
          <input id="weightKg" name="weightKg" type="number" inputMode="numeric" defaultValue={defaults.weightKg} className="field" {...f("weightKg")} />
          <FieldError id="weightKg-err" message={fieldErrs.weightKg} />
        </div>
        <div>
          <label htmlFor="district" className="mb-1 block font-medium">জেলা</label>
          <input id="district" name="district" defaultValue={defaults.district} className="field" {...f("district")} />
          <FieldError id="district-err" message={fieldErrs.district} />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block font-medium">মোবাইল নম্বর</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={defaults.phone} className="field" {...f("phone")} />
          <FieldError id="phone-err" message={fieldErrs.phone} />
        </div>
        <div>
          <label htmlFor="lastDonationDate" className="mb-1 block font-medium">শেষ রক্তদানের তারিখ</label>
          <input
            id="lastDonationDate"
            name="lastDonationDate"
            type="date"
            max={toInputDate(new Date())}
            defaultValue={defaults.lastDonationDate}
            className="field"
            {...f("lastDonationDate")}
          />
          <p className="mt-1 text-sm text-slate">কখনো না দিলে ফাঁকা রাখুন</p>
          <FieldError id="lastDonationDate-err" message={fieldErrs.lastDonationDate} />
        </div>
      </div>
      <label className="flex items-center gap-3">
        <input type="checkbox" name="isAvailable" defaultChecked={defaults.isAvailable} className="h-5 w-5 accent-[#C62A36]" />
        <span>আমি এখন রক্ত দিতে প্রস্তুত (বন্ধ করলে কোনো অনুরোধে সাড়া দিতে পারবেন না)</span>
      </label>
      <button type="submit" disabled={busy} className="btn">
        {busy ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
      </button>
    </form>
  );
}