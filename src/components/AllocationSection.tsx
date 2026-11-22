import { db } from "@/lib/db";
import { bloodGroupLabel } from "@/lib/validation";
import type { BG } from "@/lib/blood";
import { bn, daysLeft, fmtDate } from "@/lib/format";
import AllocationActions from "./AllocationActions";

export default async function AllocationSection({
  requestId,
  requestGroup,
  status,
  role,
}: {
  requestId: string;
  requestGroup: BG;
  status: string;
  role: string;
}) {
  const allocs = await db.allocation.findMany({
    where: { requestId },
    orderBy: { createdAt: "asc" },
    include: { bag: { select: { id: true, bloodGroup: true, expiryDate: true } } },
  });
  const canAllocate = role === "ADMIN" && status === "PENDING";
  if (allocs.length === 0 && !canAllocate) return null;

  return (
    <section className="mt-12" aria-labelledby="alloc-title">
      <h2 id="alloc-title" className="text-2xl font-bold">
        বরাদ্দ করা ব্যাগ ({bn(allocs.length)})
      </h2>

      {allocs.length === 0 ? (
        <p className="mt-3 max-w-2xl text-slate">
          এখনো কোনো ব্যাগ বরাদ্দ হয়নি। বোতাম চাপলে সিস্টেম হুবহু একই গ্রুপের ব্যাগ আগে, না থাকলে সামঞ্জস্যপূর্ণ গ্রুপের ব্যাগ নেবে। যে ব্যাগের মেয়াদ আগে শেষ হবে সেটা আগে যাবে।
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {allocs.map((a, i) => {
            const left = daysLeft(a.bag.expiryDate);
            return (
              <li key={a.id} className="card enter-zoom flex items-center gap-4 rounded-lg border border-line bg-surface p-4" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blood-soft text-xl font-bold text-blood-text">
                  {bloodGroupLabel[a.bag.bloodGroup]}
                </span>
                <div>
                  <p className="font-bold">ব্যাগ #{a.bag.id.slice(-6)}</p>
                  <p className="text-sm text-slate">
                    মেয়াদ {fmtDate(a.bag.expiryDate)}, {left > 0 ? `${bn(left)} দিন বাকি` : "আজ শেষ"}
                  </p>
                  <span className="mt-1 inline-block rounded-full border border-line bg-raised px-3 py-0.5 text-sm text-slate">
                    {a.bag.bloodGroup === requestGroup ? "হুবহু একই গ্রুপ" : "সামঞ্জস্যপূর্ণ গ্রুপ"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        <AllocationActions id={requestId} status={status} role={role} />
      </div>
    </section>
  );
}