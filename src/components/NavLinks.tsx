"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="প্রধান মেনু" className="flex gap-1 overflow-x-auto">
      {links.map((l) => {
const active = l.href === "/dashboard" ? path === l.href : path === l.href || path.startsWith(l.href + "/");        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
className={`whitespace-nowrap border-b-2 px-2 py-2 sm:px-3 ${              active ? "border-blood font-semibold text-ink" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}