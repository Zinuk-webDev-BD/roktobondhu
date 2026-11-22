import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStockSummary } from "@/lib/stock";
import { bloodGroupLabel } from "@/lib/validation";
import { bn, daysLeft } from "@/lib/format";
import BagTile from "@/components/BagTile";

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stock = await getStockSummary();
  const emptyGroups = stock.rows.filter((r) => r.available === 0).map((r) => bloodGroupLabel[r.bloodGroup]);

  return (
    <>
      <div className="rise">
        <p className="text-slate">স্বাগতম, {user.name}</p>
        <h1 className="mt-1 text-3xl font-bold">আজকের রক্তের স্টক</h1>
        <p className="mt-3 max-w-2xl text-lg">
          মোট {bn(stock.total)}টি ব্যাগ প্রস্তুত আছে।
          {stock.expiringSoon > 0 && ` ${bn(stock.expiringSoon)}টি ব্যাগের মেয়াদ ৭ দিনের মধ্যে শেষ হবে।`}
          {emptyGroups.length > 0 && ` ${emptyGroups.join(", ")} গ্রুপের কোনো ব্যাগ নেই।`}
        </p>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stock.rows.map((r, i) => (
          <BagTile
            key={r.bloodGroup}
            index={i}
            label={bloodGroupLabel[r.bloodGroup]}
            available={r.available}
            expiringSoon={r.expiringSoon}
            daysToNearest={r.nearestExpiry ? daysLeft(r.nearestExpiry) : null}
          />
        ))}
      </ul>
      <p className="mt-4 text-sm text-slate">ব্যাগের লাল অংশ স্টকের পরিমাণ বোঝায়, {bn(6)}টি বা বেশি হলে ব্যাগ পূর্ণ দেখায়।</p>

      <p className="mt-10 text-slate">দাতা প্রোফাইল ও রক্তের অনুরোধ পরের ধাপে যুক্ত হবে।</p>
    </>
  );
}