import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RaceDemo from "@/components/RaceDemo";

export const metadata = { title: "একযোগে পরীক্ষা | রক্তবন্ধু" };

const rules = [
  { t: "ব্যাগ দখল হয় শর্ত মিলিয়ে", d: "ব্যাগের অবস্থা 'প্রস্তুত' এবং version সংখ্যা মিললে তবেই ব্যাগ দখল হয়। দুজন একসঙ্গে চাইলে একজনের শর্ত ভেঙে যায়।" },
  { t: "সব অথবা কিছুই না", d: "পুরো বরাদ্দ একটি transaction-এ। প্রয়োজনের কম ব্যাগ মিললে সব আগের অবস্থায় ফিরে যায়।" },
  { t: "ডাটাবেস নিজেই আটকায়", d: "বরাদ্দ রেকর্ডে ব্যাগের পরিচয় UNIQUE। কোডে ভুল হলেও একই ব্যাগ দুইবার বরাদ্দ হতে পারে না।" },
  { t: "idempotency key", d: "একই key-তে আবার অনুরোধ এলে নতুন বরাদ্দ হয় না, আগের ফলই ফেরত আসে।" },
];

export default async function RaceDemoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <h1 className="enter-zoom text-3xl font-bold">একযোগে পরীক্ষা</h1>
      <p className="enter-right mt-2 max-w-2xl text-slate">
        একই সময়ে অনেকে একই ব্যাগ চাইলে সিস্টেম কী করে, নিজের চোখে দেখুন। ডেমোর ব্যাগ ও অনুরোধ আলাদা, কাজ শেষে মুছে যায়, আপনার আসল স্টক বদলায় না।
      </p>

      <RaceDemo />

      <section className="mt-14" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-bold">
          কীভাবে কাজ করে
        </h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {rules.map((r, i) => (
            <li key={r.t} className="card enter-up rounded-lg border border-line bg-surface p-4" style={{ animationDelay: `${i * 90}ms` }}>
              <p className="font-bold">{r.t}</p>
              <p className="mt-1 text-slate">{r.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}