"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FieldError, FormMessage } from "@/components/Toast";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return; // ডাবল ক্লিক আটকানো
    setBusy(true);
    setError("");
    setFields({});
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "লগইন করা যায়নি");
        setFields(data.fields ?? {});
        return;
      }
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("নেটওয়ার্কে সমস্যা। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
      <FormMessage kind="error">{error}</FormMessage>
      <div>
        <label htmlFor="email" className="mb-1 block font-medium">ইমেইল</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field"
          aria-invalid={!!fields.email} aria-describedby="email-err" />
        <FieldError id="email-err" message={fields.email} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block font-medium">পাসওয়ার্ড</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field"
          aria-invalid={!!fields.password} aria-describedby="password-err" />
        <FieldError id="password-err" message={fields.password} />
      </div>
      <button type="submit" disabled={busy} className="btn w-full">
        {busy ? "লগইন হচ্ছে..." : "লগইন করুন"}
      </button>
      <p className="text-center text-slate">
        অ্যাকাউন্ট নেই? <Link href="/register" className="font-medium text-blood underline">নতুন অ্যাকাউন্ট খুলুন</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-14">
      <Link href="/" className="font-semibold text-blood">রক্তবন্ধু</Link>
      <h1 className="mt-4 text-3xl font-bold">লগইন</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}