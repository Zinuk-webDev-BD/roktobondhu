import { bn } from "@/lib/format";

type Props = {
  label: string;
  available: number;
  expiringSoon: number;
  daysToNearest: number | null;
};

export default function BagTile({ label, available, expiringSoon, daysToNearest }: Props) {
  const bodyTop = 20;
  const bodyH = 88;
  const empty = available === 0;
  const low = available > 0 && available <= 2;
  // ৬টি বা বেশি হলে ব্যাগ পূর্ণ দেখায়
  const level = empty ? 0 : Math.max(0.14, Math.min(available / 6, 1));
  const fillH = bodyH * level;
  const clipId = `clip-${label.replace("+", "pos").replace("-", "neg")}`;

  return (
    <li className="flex flex-col items-center rounded-lg border border-line bg-white px-3 pb-4 pt-5 text-center">
      <svg viewBox="0 0 80 112" className="h-32 w-24" role="img" aria-label={`${label} গ্রুপ: ${bn(available)}টি ব্যাগ`}>
        <defs>
          <clipPath id={clipId}>
            <rect x="10" y={bodyTop} width="60" height={bodyH} rx="12" />
          </clipPath>
        </defs>
        <rect x="32" y="4" width="16" height="22" rx="4" fill="#fff" stroke="#1D2326" strokeOpacity=".35" strokeWidth="2" />
        <rect x="10" y={bodyTop} width="60" height={bodyH} rx="12" fill="#fff" />
        {!empty && (
          <rect x="10" y={bodyTop + bodyH - fillH} width="60" height={fillH} fill="#B3202A" clipPath={`url(#${clipId})`} />
        )}
        <rect
          x="10" y={bodyTop} width="60" height={bodyH} rx="12" fill="none"
          stroke={empty ? "#B3202A" : "#1D2326"} strokeOpacity={empty ? 1 : 0.35} strokeWidth="2"
          strokeDasharray={empty ? "5 4" : undefined}
        />
        <text
          x="40" y="70" textAnchor="middle" fontSize="20" fontWeight="700"
          fill="#1D2326" stroke="#fff" strokeWidth="4" paintOrder="stroke" aria-hidden="true"
        >
          {label}
        </text>
      </svg>

      <p className="mt-2 text-2xl font-bold">
        {bn(available)}
        <span className="text-base font-normal text-slate"> টি</span>
      </p>
      <p className={empty ? "font-semibold text-blood" : low ? "font-medium text-blood-dark" : "text-ok"}>
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