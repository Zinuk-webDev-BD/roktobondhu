"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FieldError, FormMessage } from "@/components/Toast";
import { bloodGroups, bloodGroupLabel } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"DONOR" | "HOSPITAL">("DONOR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setFields({});
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    const payload: Record<string, unknown> = { ...fd, role };
    if (role === "HOSPITAL") {
      for (const k of ["bloodGroup", "dateOfBirth", "weightKg", "district", "phone"]) delete payload[k];
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "অ্যাকাউন্ট খোলা যায়নি");
        setFields(data.fields ?? {});
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  }

  const f = (k: string) => ({ "aria-invalid": !!fields[k], "aria-describedby": `${k}-err` });

  return (
    <main id="main" className="mx-auto max-w-lg px-5 py-14">
      <Link href="/" className="font-semibold text-blood">রক্তবন্ধু</Link>
      <h1 className="mt-4 text-3xl font-bold">নতুন অ্যাকাউন্ট</h1>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <FormMessage kind="error">{error}</FormMessage>

        <fieldset>
          <legend className="mb-1 font-medium">আপনি কে?</legend>
          <div className="grid grid-cols-2 gap-3">
            {([["DONOR", "রক্তদাতা"], ["HOSPITAL", "হাসপাতাল / অনুরোধকারী"]] as const).map(([val, label]) => (
              <label key={val}
                className={`cursor-pointer rounded-md border px-3 py-2.5 text-center ${role === val ? "border-blood bg-blood-soft font-medium" : "border-line bg-white"}`}>
                <input type="radio" name="roleChoice" value={val} checked={role === val}
                  onChange={() => setRole(val)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className="mb-1 block font-medium">{role === "DONOR" ? "পুরো নাম" : "হাসপাতাল বা প্রতিষ্ঠানের নাম"}</label>
          <input id="name" name="name" autoComplete="name" required className="field" {...f("name")} />
          <FieldError id="name-err" message={fields.name} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block font-medium">ইমেইল</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" {...f("email")} />
          <FieldError id="email-err" message={fields.email} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block font-medium">পাসওয়ার্ড</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required className="field" {...f("password")} />
          <p className="mt-1 text-sm text-slate">কমপক্ষে ৮ অক্ষর, একটি অক্ষর ও একটি সংখ্যা সহ</p>
          <FieldError id="password-err" message={fields.password} />
        </div>

        {role === "DONOR" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bloodGroup" className="mb-1 block font-medium">রক্তের গ্রুপ</label>
                <select id="bloodGroup" name="bloodGroup" defaultValue="" className="field" {...f("bloodGroup")}>
                  <option value="" disabled>বেছে নিন</option>
                  {bloodGroups.map((g) => <option key={g} value={g}>{bloodGroupLabel[g]}</option>)}
                </select>
                <FieldError id="bloodGroup-err" message={fields.bloodGroup} />
              </div>
              <div>
                <label htmlFor="weightKg" className="mb-1 block font-medium">ওজন (কেজি)</label>
                <input id="weightKg" name="weightKg" type="number" inputMode="numeric" className="field" {...f("weightKg")} />
                <FieldError id="weightKg-err" message={fields.weightKg} />
              </div>
            </div>
            <div>
              <label htmlFor="dateOfBirth" className="mb-1 block font-medium">জন্মতারিখ</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" className="field" {...f("dateOfBirth")} />
              <FieldError id="dateOfBirth-err" message={fields.dateOfBirth} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="district" className="mb-1 block font-medium">জেলা</label>
                <input id="district" name="district" className="field" {...f("district")} />
                <FieldError id="district-err" message={fields.district} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block font-medium">মোবাইল নম্বর</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" className="field" {...f("phone")} />
                <FieldError id="phone-err" message={fields.phone} />
              </div>
            </div>
          </>
        )}

        <button type="submit" disabled={busy} className="btn w-full">
          {busy ? "অ্যাকাউন্ট খোলা হচ্ছে..." : "অ্যাকাউন্ট খুলুন"}
        </button>
        <p className="text-center text-slate">
          আগেই অ্যাকাউন্ট আছে? <Link href="/login" className="font-medium text-blood underline">লগইন করুন</Link>
        </p>
      </form>
    </main>
  );
}