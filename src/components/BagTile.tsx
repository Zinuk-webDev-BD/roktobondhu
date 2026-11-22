import { bn } from "@/lib/format";
import CountUp from "./CountUp";

type Props = {
  label: string;
  available: number;
  expiringSoon: number;
  daysToNearest: number | null;
  index: number;
};

// ঢেউয়ের আকার। ৩০ একক পর পর নকশা পুনরাবৃত্তি হয়, তাই চক্রটি জোড়া লেগে যায়
function wavePath(y: number, bottom: number, amp: number) {
  let d = `M -20 ${y} q 7.5 ${-amp} 15 0`;
  for (let i = 0; i < 8; i++) d += " t 15 0";
  return `${d} L 115 ${bottom} L -20 ${bottom} Z`;
}

function Pulse({ color }: { color: string }) {
  return (
    <span className="relative mr-2 inline-flex h-2 w-2 align-middle" aria-hidden="true">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${color}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

export default function BagTile({ label, available, expiringSoon, daysToNearest, index }: Props) {
  const bodyTop = 20;
  const bodyH = 88;
  const empty = available === 0;
  const low = available > 0 && available <= 2;
  // ৬টি বা বেশি হলে ব্যাগ পূর্ণ দেখায়
  const level = empty ? 0 : Math.max(0.14, Math.min(available / 6, 1));
  const fillH = bodyH * level;
  const fillY = bodyTop + bodyH - fillH;
  const bottom = bodyTop + bodyH + 4;
  const clipId = `clip-${label.replace("+", "pos").replace("-", "neg")}`;

  return (
    <li className="flex flex-col items-center rounded-lg border border-line bg-surface px-3 pb-4 pt-5 text-center">
      <svg viewBox="0 0 80 112" className="h-32 w-24" role="img" aria-label={`${label} গ্রুপ: ${bn(available)}টি ব্যাগ`}>
        <defs>
          <clipPath id={clipId}>
            <rect x="10" y={bodyTop} width="60" height={bodyH} rx="12" />
          </clipPath>
        </defs>

        {/* ব্যাগের মুখ */}
        <rect x="32" y="4" width="16" height="22" rx="4" fill="#1A242C" stroke="#9FACB4" strokeOpacity=".6" strokeWidth="2" />
        {/* ব্যাগের ভেতরটা */}
        <rect x="10" y={bodyTop} width="60" height={bodyH} rx="12" fill="#111820" />

        {/* রক্ত: পেছনে গাঢ় ঢেউ, সামনে উজ্জ্বল ঢেউ */}
        {!empty && (
          <g clipPath={`url(#${clipId})`}>
            <g className="bag-fill" style={{ "--i": index } as React.CSSProperties}>
              <path className="bag-wave-back" d={wavePath(fillY - 1.5, bottom, 5)} fill="#8E1B25" />
              <path className="bag-wave" d={wavePath(fillY, bottom, 4)} fill="#D7313D" />
            </g>
          </g>
        )}

        {/* ব্যাগের রেখা। স্টক শেষ হলে ডটেড লাল */}
        <rect
          x="10" y={bodyTop} width="60" height={bodyH} rx="12" fill="none"
          stroke={empty ? "#FF6B73" : "#9FACB4"} strokeOpacity={empty ? 1 : 0.6} strokeWidth="2"
          strokeDasharray={empty ? "5 4" : undefined}
        />
        <text
          x="40" y="70" textAnchor="middle" fontSize="20" fontWeight="700"
          fill="#E8ECEE" stroke="#111820" strokeWidth="4" paintOrder="stroke" aria-hidden="true"
        >
          {label}
        </text>
      </svg>

      <p className="mt-2 text-2xl font-bold">
        <CountUp value={available} delayMs={250 + index * 90} />
        <span className="text-base font-normal text-slate"> টি</span>
      </p>
      <p className={empty ? "font-semibold text-blood-text" : low ? "font-medium text-warn" : "text-ok"}>
        {empty && <Pulse color="bg-blood-text" />}
        {low && <Pulse color="bg-warn" />}
        {empty ? "স্টক নেই" : low ? "স্টক কম" : "পর্যাপ্ত"}
      </p>
      {expiringSoon > 0 && (
        <p className="mt-1 text-sm text-slate">
          {bn(expiringSoon)}টির মেয়াদ {bn(Math.max(daysToNearest ?? 0, 0))} দিনে শেষ
        </p>
      )}
    </li>
  );
}