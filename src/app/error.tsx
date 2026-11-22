"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="text-2xl font-bold">কিছু একটা ভুল হয়েছে</h1>
      <p className="mt-2 text-slate">সার্ভার বা ডাটাবেসের সঙ্গে যোগাযোগ করা যায়নি। একটু পরে আবার চেষ্টা করুন।</p>
      <button onClick={reset} className="btn mt-6">আবার চেষ্টা করুন</button>
    </main>
  );
}