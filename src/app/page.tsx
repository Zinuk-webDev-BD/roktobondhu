import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const roleLabel = { DONOR: "রক্তদাতা", HOSPITAL: "হাসপাতাল", ADMIN: "অ্যাডমিন" } as const;

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main id="main" className="mx-auto max-w-5xl px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="font-semibold text-blood">রক্তবন্ধু</p>
          <h1 className="text-2xl font-bold">স্বাগতম, {user.name}</h1>
          <p className="text-slate">ভূমিকা: {roleLabel[user.role]}</p>
        </div>
        <LogoutButton />
      </header>
      <p className="mt-8 text-slate">দাতা, অনুরোধ ও স্টক মডিউল পরের ধাপে যুক্ত হবে।</p>
    </main>
  );
}