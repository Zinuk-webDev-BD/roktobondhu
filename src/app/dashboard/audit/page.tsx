import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { bn } from "@/lib/format";

export const metadata = { title: "অডিট লগ | রক্তবন্ধু" };

const labels: Record<string, string> = {
  ALLOCATE: "ব্যাগ বরাদ্দ",
  ALLOCATE_REPLAY: "বরাদ্দ (আগের ফল ফেরত)",
  ALLOCATE_FAILED: "বরাদ্দ ব্যর্থ",
  FULFILL: "অনুরোধ সম্পন্ন",
  REQUEST_CREATE: "অনুরোধ তৈরি",
  REQUEST_UPDATE: "অনুরোধ সম্পাদনা",
  REQUEST_CANCEL: "অনুরোধ বাতিল",
  REQUEST_DELETE: "অনুরোধ মোছা",
  OFFER_CREATE: "দাতার সাড়া",
  PROFILE_UPDATE: "প্রোফাইল বদল",
  ACCESS_DENIED: "অনুমতি ছাড়া চেষ্টা (আটকানো হয়েছে)",
  RACE_DEMO: "একযোগে পরীক্ষা",
    AUTH_LOGIN: "লগইন",
  AUTH_LOGIN_FAILED: "লগইন ব্যর্থ (ভুল তথ্য)",
  AUTH_LOGIN_BLOCKED: "লগইন আটকানো (অনেকবার চেষ্টা)",
};

const fmt = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

export default async function AuditPage({ searchParams }: { searchParams: { action?: string; failed?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const action = searchParams.action?.slice(0, 60) || undefined;
  const failedOnly = searchParams.failed === "1";

  const [logs, actions, total, failedTotal] = await Promise.all([
    db.auditLog.findMany({
      where: { ...(action ? { action } : {}), ...(failedOnly ? { success: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { name: true, role: true } } },
    }),
    db.auditLog.groupBy({ by: ["action"], _count: { _all: true }, orderBy: { action: "asc" } }),
    db.auditLog.count(),
    db.auditLog.count({ where: { success: false } }),
  ]);

  const roleLabel = { ADMIN: "অ্যাডমিন", HOSPITAL: "হাসপাতাল", DONOR: "দাতা" } as const;

  return (
    <>
      <h1 className="enter-zoom text-3xl font-bold">অডিট লগ</h1>
      <p className="enter-right mt-2 max-w-2xl text-slate">কে কখন কী করেছে আর কোন চেষ্টা আটকে গেছে, সব এখানে জমা থাকে। এই তালিকা মোছা বা বদলানো যায় না।</p>

      <div className="enter-up mt-6 grid grid-cols-2 gap-3 sm:max-w-md" style={{ animationDelay: "120ms" }}>
        <div className="card rounded-lg border border-line bg-surface p-4 text-center">
          <p className="text-3xl font-bold">{bn(total)}</p>
          <p className="text-sm text-slate">মোট এন্ট্রি</p>
        </div>
        <div className="card rounded-lg border border-line bg-surface p-4 text-center">
          <p className="text-3xl font-bold text-blood-text">{bn(failedTotal)}</p>
          <p className="text-sm text-slate">ব্যর্থ বা আটকানো</p>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="action" className="mb-1 block text-sm font-medium">কাজের ধরন</label>
          <select id="action" name="action" defaultValue={action ?? ""} className="field min-w-56">
            <option value="">সব ধরন</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>
                {labels[a.action] ?? a.action} ({bn(a._count._all)})
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2.5">
          <input type="checkbox" name="failed" value="1" defaultChecked={failedOnly} className="h-5 w-5 accent-[#C62A36]" />
          <span>শুধু ব্যর্থ বা আটকানো</span>
        </label>
        <button type="submit" className="btn">ফিল্টার করুন</button>
      </form>

      <p className="mt-4 text-sm text-slate">সর্বশেষ {bn(logs.length)}টি এন্ট্রি দেখাচ্ছে</p>

      {logs.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-line px-5 py-10 text-center text-slate">এই ফিল্টারে কোনো এন্ট্রি নেই।</div>
      ) : (
        <div className="card mt-3 overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-line text-sm text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">সময়</th>
                <th className="px-4 py-3 font-medium">কে</th>
                <th className="px-4 py-3 font-medium">কী করেছে</th>
                <th className="px-4 py-3 font-medium">ফল</th>
                <th className="px-4 py-3 font-medium">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line/60 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{fmt.format(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    {l.actor ? (
                      <>
                        <span className="block">{l.actor.name}</span>
                        <span className="text-sm text-slate">{roleLabel[l.actor.role]}</span>
                      </>
                    ) : (
                      <span className="text-slate">অজানা</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{labels[l.action] ?? l.action}</span>
                    <span className="font-mono text-xs text-slate">{l.action}</span>
                  </td>
                  <td className="px-4 py-3">
<span className={`rounded px-2 py-0.5 text-sm ${l.success ? "bg-ok-soft text-ok" : "bg-blood-soft text-blood-text"}`}>                      {l.success ? "সফল" : "ব্যর্থ"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate">
                    {l.resource && (
                      <span className="block">
                        {l.resource}
                        {l.resourceId ? ` #${l.resourceId.slice(-6)}` : ""}
                      </span>
                    )}
                    {l.ip && <span className="block">IP: {l.ip}</span>}
                    {l.meta ? <span className="block max-w-xs truncate font-mono text-xs" title={JSON.stringify(l.meta)}>{JSON.stringify(l.meta)}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}