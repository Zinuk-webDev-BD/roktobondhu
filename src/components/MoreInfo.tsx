import Reveal from "./Reveal";

const foods = ["পানি ও ফলের রস", "ডাল", "ডিম", "কলিজা ও লাল মাংস", "পালং ও কচু শাক", "খেজুর", "কমলা ও লেবু"];

const dos = [
  "দান শেষে অন্তত ১০–১৫ মিনিট বসে বা শুয়ে বিশ্রাম নিন",
  "পরের ২৪ থেকে ৪৮ ঘণ্টা স্বাভাবিকের চেয়ে বেশি পানি ও তরল খান",
  "সুঁই ফোটানো জায়গার ব্যান্ডেজ কয়েক ঘণ্টা রাখুন",
  "আয়রন ও প্রোটিনসমৃদ্ধ খাবার খান",
  "মাথা ঘুরলে সঙ্গে সঙ্গে শুয়ে পড়ুন এবং পা একটু উঁচু করে রাখুন",
];
const donts = [
  "দানের পর সঙ্গে সঙ্গে উঠে দাঁড়াবেন না",
  "২৪ ঘণ্টা ভারী ব্যায়াম ও ভারী জিনিস তোলা এড়িয়ে চলুন",
  "কয়েক ঘণ্টা ধূমপান ও অ্যালকোহল এড়িয়ে চলুন",
  "খালি পেটে থাকবেন না",
  "ব্যান্ডেজের জায়গা ঘষবেন না বা চুলকাবেন না",
];

const faqs = [
  { q: "রক্ত দেওয়ার আগে কী খাব?", a: "দেওয়ার আগের কয়েক ঘণ্টায় হালকা কিন্তু পুষ্টিকর খাবার খান আর প্রচুর পানি পান করুন। অতিরিক্ত তেল-চর্বির খাবার এড়িয়ে চলুন, আর খালি পেটে যাবেন না। আগের রাতে ভালো ঘুমানো জরুরি।" },
  { q: "দানের পর কাজে যেতে পারব?", a: "সাধারণত পারবেন। তবে সেদিন ভারী পরিশ্রম ও ব্যায়াম এড়িয়ে চলা ভালো। শরীর খারাপ লাগলে বিশ্রাম নিন।" },
  { q: "বছরে সর্বোচ্চ কতবার দেওয়া যায়?", a: "৩ মাস ব্যবধান ধরলে বছরে সর্বোচ্চ ৪ বার। ব্যবধান ব্লাড ব্যাংকভেদে সামান্য আলাদা হতে পারে, তাই চিকিৎসকের কথা মানুন।" },
  { q: "দেওয়া রক্ত কি পরীক্ষা করা হয়?", a: "হ্যাঁ। রোগীকে দেওয়ার আগে হেপাটাইটিস বি ও সি, এইচআইভি, সিফিলিস ও ম্যালেরিয়া পরীক্ষা করা হয়। পরীক্ষায় কোনো সমস্যা পাওয়া গেলে ওই রক্ত ব্যবহার করা হয় না।" },
  { q: "আমার রক্তের গ্রুপ জানা না থাকলে?", a: "রক্তদানের সময়ই ব্লাড ব্যাংক বিনা খরচে আপনার গ্রুপ জানিয়ে দেয়। কোনো পরীক্ষাগারেও সামান্য খরচে করানো যায়।" },
];

export function Aftercare() {
  return (
    <section className="mt-16" aria-labelledby="after-title">
      <Reveal variant="right">
        <h2 id="after-title" className="text-2xl font-bold">
          রক্তদানের পর যত্ন
        </h2>
        <p className="mt-2 max-w-2xl text-slate">রক্তদানের পর শরীর নিজেই দ্রুত সামলে নেয়। শুধু কয়েকটি ছোট নিয়ম মানলে আরাম থাকে।</p>
      </Reveal>

      <Reveal variant="up" className="mt-6">
        <p className="font-semibold">কী কী খাবেন</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {foods.map((f, i) => (
            <Reveal key={f} variant="zoom" delay={i * 70}>
              <span className="inline-block rounded-full border border-line bg-surface px-4 py-1.5 transition duration-200 hover:-translate-y-0.5 hover:border-ok hover:text-ok">{f}</span>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Reveal variant="left">
          <div className="card h-full rounded-lg border border-line bg-surface p-5">
            <p className="font-bold text-ok">করুন</p>
            <ul className="mt-3 space-y-2">
              {dos.map((t) => (
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
            <p className="font-bold text-warn">এড়িয়ে চলুন</p>
            <ul className="mt-3 space-y-2">
              {donts.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-warn" aria-hidden="true">!</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
      <p className="mt-3 text-sm text-slate">জ্বর, দুর্বলতা বা মাথা ঘোরা কয়েক দিনের বেশি থাকলে চিকিৎসকের পরামর্শ নিন।</p>
    </section>
  );
}

export function Faq() {
  return (
    <section className="mt-16" aria-labelledby="faq-title">
      <Reveal variant="left">
        <h2 id="faq-title" className="text-2xl font-bold">
          সাধারণ প্রশ্নোত্তর
        </h2>
      </Reveal>
      <div className="mt-6 space-y-3">
        {faqs.map((f, i) => (
          <Reveal key={f.q} variant="up" delay={i * 80}>
            <details className="card group rounded-lg border border-line bg-surface">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 font-semibold">
                {f.q}
                <svg viewBox="0 0 24 24" className="chev h-5 w-5 shrink-0 text-blood-text transition-transform duration-300" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="faq-body px-5 pb-4 text-slate">{f.a}</div>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}