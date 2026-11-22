import Link from "next/link";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";
import type { CurrentUser } from "@/lib/auth";

const roleLabel = { DONOR: "রক্তদাতা", HOSPITAL: "হাসপাতাল", ADMIN: "অ্যাডমিন" } as const;

function DropMark() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true">
      <path d="M9 1C9 1 1.5 9.5 1.5 14a7.5 7.5 0 0 0 15 0C16.5 9.5 9 1 9 1z" fill="#B3202A" />
    </svg>
  );
}

export default function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const links = [{ href: "/dashboard", label: "স্টক বোর্ড" }];
  if (user.role === "ADMIN") links.push({ href: "/admin/stock", label: "ব্যাগ ব্যবস্থাপনা" });

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-blood">
            <DropMark />
            রক্তবন্ধু
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <NavLinks links={links} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-slate">{roleLabel[user.role]}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 py-8">
        {children}
      </main>
    </div>
  );
}