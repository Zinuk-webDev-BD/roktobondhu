import Link from "next/link";
import { features } from "@/lib/features";

function Icon({ name }: { name: (typeof features)[number]["icon"] }) {
  const paths = {
    swap: <path d="M7 7h12l-3-3M17 17H5l3 3" />,
    book: <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15zM4 20.5A2.5 2.5 0 006.5 18H20" />,
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
    pin: (
      <>
        <path d="M12 21s-6-5.6-6-11a6 6 0 0112 0c0 5.4-6 11-6 11z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function FeatureGrid({ exclude, compact = false }: { exclude?: string; compact?: boolean }) {
  const list = features.filter((f) => f.href !== exclude);
  return (
    <ul className={compact ? "grid gap-3 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
      {list.map((f, i) => (
        <li key={f.href}>
          <Link
            href={f.href}
            className={`card enter-up flex h-full gap-4 rounded-lg border border-line bg-surface ${compact ? "items-center p-4" : "flex-col p-5"}`}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blood-soft text-blood-text">
              <Icon name={f.icon} />
            </span>
            <span>
              <span className="block text-lg font-bold">{f.title}</span>
              {!compact && <span className="mt-1 block text-slate">{f.desc}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}