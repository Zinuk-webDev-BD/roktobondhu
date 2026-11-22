import Reveal, { Stat } from "./Reveal";

const parts = [
  { name: "লোহিত রক্তকণিকা", role: "শরীরে অক্সিজেন বহন করে। দুর্ঘটনা ও অস্ত্রোপচারে সবচেয়ে বেশি লাগে।", life: "ফ্রিজে প্রায় ৪২ দিন" },
  { name: "প্লাটিলেট", role: "রক্ত জমাট বাঁধতে সাহায্য করে। ক্যানসার ও ডেঙ্গুর গুরুতর রোগীদের কখনো কখনো লাগে।", life: "মাত্র ৫–৭ দিন" },
  { name: "প্লাজমা", role: "রক্তের তরল অংশ। পোড়া ও বড় রক্তক্ষরণের রোগীদের কাজে লাগে।", life: "জমিয়ে প্রায় ১ বছর" },
];

const steps = [
  { t: "নিবন্ধন ও প্রশ্ন", d: "নাম, বয়স ও স্বাস্থ্যের কিছু সাধারণ প্রশ্নের উত্তর দিতে হয়।" },
  { t: "স্বাস্থ্য পরীক্ষা", d: "ওজন, রক্তচাপ, নাড়ি ও হিমোগ্লোবিন মাপা হয়।" },
  { t: "রক্তদান", d: "শুয়ে বা আধশোয়া অবস্থায় ৮–১০ মিনিটে এক ব্যাগ রক্ত নেওয়া হয়।" },
  { t: "বিশ্রাম ও খাবার", d: "১৫ মিনিট বিশ্রাম নিয়ে পানি ও হালকা খাবার খেতে হয়।" },
];

const canDo = [
  "বয়স সাধারণত ১৮ থেকে ৬০ বছর",
  "ওজন কমপক্ষে ৫০ কেজি",
  "হিমোগ্লোবিন পর্যাপ্ত (সাধারণত ১২.৫ গ্রাম/ডেসি.লি. বা বেশি)",
  "আগের রক্তদানের পর কমপক্ষে ৩ মাস (৯০ দিন) পার হয়েছে",
  "সেদিন শরীর সুস্থ ও রাতে ভালো ঘুম হয়েছে",
];
const wait = [
  "জ্বর, সর্দি-কাশি বা কোনো সংক্রমণ চলছে",
  "গর্ভাবস্থা বা বুকের দুধ খাওয়ানোর সময়",
  "সাম্প্রতিক অস্ত্রোপচার, ট্যাটু বা দাঁত তোলা",
  "হেপাটাইটিস, এইচআইভির মতো রক্তবাহিত সংক্রমণ আছে",
  "ক্ষুধার্ত অবস্থায় বা খুব ক্লান্ত থাকলে",
];

const myths = [
  { m: "রক্ত দিলে শরীর দুর্বল হয়ে যায়।", t: "প্লাজমা ২৪–৪৮ ঘণ্টায় আর লোহিত কণিকা কয়েক সপ্তাহে শরীর নিজেই ফিরিয়ে আনে।" },
  { m: "রক্ত দিতে অনেক ব্যথা লাগে।", t: "শুধু সুঁই ফোটানোর সময় সামান্য চিনচিন করে, এরপর ব্যথা থাকে না।" },
  { m: "নারীরা রক্ত দিতে পারেন না।", t: "যোগ্যতার শর্ত পূরণ করলে নারীরাও নিয়মিত রক্ত দিতে পারেন।" },
  { m: "রক্ত দিলে সংক্রমণ হতে পারে।", t: "প্রতিবার নতুন, জীবাণুমুক্ত ও একবার ব্যবহারের সুঁই ও ব্যাগ ব্যবহার হয়।" },
];

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold">{children}</h2>;
}

export default function InfoSections() {
  return (
    <>
      {/* দ্রুত তথ্য */}
      <section className="mt-16" aria-label="দ্রুত তথ্য">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat value={450} unit="মি.লি." label="এক ব্যাগ রক্ত" />
          <Stat value={10} unit="মিনিট" label="রক্ত নিতে সময় (প্রায়)" />
          <Stat value={3} unit="জীবন" label="এক ব্যাগ থেকে সর্বোচ্চ" />
          <Stat value={42} unit="দিন" label="লোহিত কণিকার মেয়াদ" />
        </div>
      </section>

      {/* রক্তের উপাদান */}
      <section className="mt-16" aria-labelledby="parts-title">
        <Reveal variant="left">
          <Title>
            <span id="parts-title">রক্তের তিন উপাদান</span>
          </Title>
          <p className="mt-2 max-w-2xl text-slate">এক ব্যাগ রক্ত ভেঙে আলাদা তিন ভাগ করা যায়, তাই একজন দাতা একাধিক রোগীর কাজে লাগেন।</p>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {parts.map((p, i) => (
            <Reveal key={p.name} variant={i === 0 ? "left" : i === 1 ? "zoom" : "right"} delay={i * 120}>
              <div className="card h-full rounded-lg border border-line border-t-2 border-t-blood bg-surface p-5">
                <p className="text-lg font-bold">{p.name}</p>
                <p className="mt-2 text-slate">{p.role}</p>
                <p className="mt-4 inline-block rounded-full bg-blood-soft px-3 py-1 text-sm text-blood-text">{p.life}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* রক্তদানের ধাপ */}
      <section className="mt-16" aria-labelledby="steps-title">
        <Reveal variant="right">
          <Title>
            <span id="steps-title">রক্তদান কীভাবে হয়</span>
          </Title>
        </Reveal>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t}>
              <Reveal variant="up" delay={i * 130}>
                <div className="card h-full rounded-lg border border-line bg-surface p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blood font-bold text-white shadow-lg shadow-blood/30">
                    {["১", "২", "৩", "৪"][i]}
                  </span>
                  <p className="mt-3 font-bold">{s.t}</p>
                  <p className="mt-1 text-slate">{s.d}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* যোগ্যতা */}
      <section className="mt-16" aria-labelledby="elig-title">
        <Reveal variant="left">
          <Title>
            <span id="elig-title">কে রক্ত দিতে পারেন</span>
          </Title>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Reveal variant="left">
            <div className="card h-full rounded-lg border border-line bg-surface p-5">
              <p className="font-bold text-ok">সাধারণত দিতে পারেন</p>
              <ul className="mt-3 space-y-2">
                {canDo.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-ok" aria-hidden="true">✓</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal variant="right">
            <div className="card h-full rounded-lg border border-line bg-surface p-5">
              <p className="font-bold text-warn">এই সময়ে অপেক্ষা করুন</p>
              <ul className="mt-3 space-y-2">
                {wait.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-warn" aria-hidden="true">!</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
        <p className="mt-3 text-sm text-slate">এটি সাধারণ সচেতনতার তথ্য। রক্তদানের আগে চূড়ান্ত সিদ্ধান্ত ব্লাড ব্যাংকের চিকিৎসক নেন।</p>
      </section>

      {/* ভুল ধারণা */}
      <section className="mt-16" aria-labelledby="myth-title">
        <Reveal variant="zoom">
          <Title>
            <span id="myth-title">ভুল ধারণা বনাম সত্য</span>
          </Title>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {myths.map((x, i) => (
            <Reveal key={x.m} variant={i % 2 === 0 ? "left" : "right"} delay={(i % 2) * 100}>
              <div className="card h-full rounded-lg border border-line bg-surface p-5">
                <p className="text-slate line-through decoration-blood-text/70">{x.m}</p>
                <p className="mt-3">
                  <span className="mr-2 rounded bg-ok-soft px-2 py-0.5 text-sm text-ok">সত্য</span>
                  {x.t}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}