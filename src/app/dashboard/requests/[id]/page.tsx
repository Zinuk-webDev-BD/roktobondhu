import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { expireOldRequests } from "@/lib/requests";
import { suggestDonors } from "@/lib/matching";
import { canTransition, DELETABLE } from "@/lib/requestFlow";
import { bloodGroupLabel } from "@/lib/validation";
import { bn, bnDigits, daysLeft, fmtDate, toInputDate } from "@/lib/format";
import type { RequestStatus } from "@/lib/labels";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import RequestTimeline from "@/components/RequestTimeline";
import RequestActions from "@/components/RequestActions";
import AllocationSection from "@/components/AllocationSection";
export const metadata = { title: "অনুরোধের বিস্তারিত | রক্তবন্ধু" };

export default async function RequestDetail({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "DONOR") redirect("/dashboard/requests");

  await expireOldRequests();
  const request = await db.bloodRequest.findUnique({
    where: { id: params.id },
    include: {
      offers: {
        orderBy: { createdAt: "asc" },
        include: { donor: { select: { name: true, donorProfile: { select: { bloodGroup: true, district: true, phone: true } } } } },
      },
    },
  });
  if (!request) notFound();

  // রিসোর্স-ভিত্তিক সুরক্ষা: অন্যের অনুরোধ দেখা যাবে না, চেষ্টাটি লগে থাকবে
  if (user.role !== "ADMIN" && request.requesterId !== user.id) {
    await audit({ actorId: user.id, action: "ACCESS_DENIED", resource: "BloodRequest", resourceId: request.id, success: false });
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">এই অনুরোধ আপনার নয়</h1>
        <p className="mt-2 text-slate">অন্য হাসপাতালের অনুরোধ দেখার অনুমতি নেই। চেষ্টাটি নিরাপত্তা লগে রাখা হয়েছে।</p>
        <Link href="/dashboard/requests" className="btn mt-6">আমার অনুরোধে ফিরুন</Link>
      </div>
    );
  }

  const status = request.status as RequestStatus;
  const open = status === "PENDING";
  const sug = open ? await suggestDonors({ bloodGroup: request.bloodGroup, district: request.district }) : null;
  const left = daysLeft(request.expiresAt);

  const info: [string, string][] = [
    ["রোগী", request.patientName],
    ["রক্তের গ্রুপ", bloodGroupLabel[request.bloodGroup]],
    ["ব্যাগ", `${bn(request.units)}টি`],
    ["জেলা", request.district],
    ["হাসপাতাল", request.hospital],
    ["কবে পর্যন্ত লাগবে", `${fmtDate(request.expiresAt)}${open || status === "MATCHED" ? (left > 0 ? ` (${bn(left)} দিন বাকি)` : " (আজ শেষ)") : ""}`],
    ["অনুরোধ জমা", fmtDate(request.createdAt)],
  ];

  return (
    <>
      <Link href="/dashboard/requests" className="enter-left inline-flex items-center gap-1 text-slate transition-colors hover:text-ink">
        ← সব অনুরোধ
      </Link>

      <div className="enter-zoom mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">
          {request.patientName}, {bloodGroupLabel[request.bloodGroup]}
        </h1>
        <UrgencyBadge urgency={request.urgency} />
        <StatusBadge status={status} />
      </div>

      <div className="enter-up mt-6" style={{ animationDelay: "150ms" }}>
        <RequestTimeline status={status} />
      </div>

      <dl className="enter-up card mt-8 grid gap-4 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2" style={{ animationDelay: "250ms" }}>
        {info.map(([k, v]) => (
          <div key={k}>
            <dt className="text-sm text-slate">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
        {request.note && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-slate">অতিরিক্ত তথ্য</dt>
            <dd>{request.note}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6">
        <RequestActions
          id={request.id}
          status={status}
          canCancel={canTransition(status, "CANCELLED")}
          canDelete={DELETABLE.includes(status)}
          defaults={{ units: request.units, urgency: request.urgency, expiresAt: toInputDate(request.expiresAt), note: request.note ?? "" }}
        />
      </div>
      <AllocationSection requestId={request.id} requestGroup={request.bloodGroup} status={status} role={user.role} />
      {/* যে দাতারা সাড়া দিয়েছেন */}
      <section className="mt-12" aria-labelledby="offers-title">
        <h2 id="offers-title" className="text-2xl font-bold">
          সাড়া দেওয়া দাতা ({bn(request.offers.length)})
        </h2>
        {request.offers.length === 0 ? (
          <p className="mt-3 text-slate">এখনো কোনো দাতা সাড়া দেননি। দাতার ফোন নম্বর শুধু সাড়া দেওয়ার পর এখানে দেখা যায়।</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {request.offers.map((o) => (
              <li key={o.id} className="card rounded-lg border border-line bg-surface p-4">
                <p className="text-lg font-bold">{o.donor.name}</p>
                <p className="text-slate">
                  {o.donor.donorProfile ? `${bloodGroupLabel[o.donor.donorProfile.bloodGroup]}, ${o.donor.donorProfile.district}` : ""}
                </p>
                {o.donor.donorProfile && (
                  <a href={`tel:${o.donor.donorProfile.phone}`} className="btn-quiet mt-3 text-sm">
                    ফোন করুন: {bnDigits(o.donor.donorProfile.phone)}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ম্যাচিং: কেন এই দাতা */}
      {sug && (
        <section className="mt-12" aria-labelledby="match-title">
          <h2 id="match-title" className="text-2xl font-bold">সম্ভাব্য যোগ্য দাতা</h2>
          <p className="mt-2 max-w-2xl text-slate">
            সিস্টেম গ্রুপের সামঞ্জস্য, যোগ্যতার নিয়ম (বয়স, ওজন, ৯০ দিনের ব্যবধান), জেলা ও শেষ দানের তারিখ দেখে সাজিয়েছে। মোট {bn(sug.compatibleTotal)}
            জন সামঞ্জস্যপূর্ণ দাতার মধ্যে {bn(sug.eligibleTotal)}জন এখন দিতে পারেন।
          </p>

          {sug.eligible.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-line px-5 py-8 text-center text-slate">
              এখন কোনো যোগ্য দাতা পাওয়া যায়নি। ব্লাড ব্যাংকের স্টক বা অন্য জেলার দাতার খোঁজ নিন।
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {sug.eligible.map((d) => (
                <li key={d.id} className="card rounded-lg border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold">{d.name}</p>
                    <span className="rounded bg-blood-soft px-2 py-0.5 font-bold text-blood-text">{bloodGroupLabel[d.bloodGroup]}</span>
                  </div>
                  <p className="text-slate">{d.district}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {d.reasons.map((r) => (
                      <li key={r} className="rounded-full border border-line bg-raised px-3 py-0.5 text-sm text-slate">{r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {user.role === "ADMIN" && sug.excluded.length > 0 && (
            <details className="card mt-4 rounded-lg border border-line bg-surface">
              <summary className="px-5 py-4 font-semibold">কেন {bn(sug.excluded.length)}জন দাতা বাদ পড়লেন</summary>
              <ul className="space-y-3 px-5 pb-4">
                {sug.excluded.map((d) => (
                  <li key={d.id}>
                    <p className="font-medium">
                      {d.name} ({bloodGroupLabel[d.bloodGroup]})
                    </p>
                    <p className="text-sm text-slate">{d.reasons.join("; ")}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </>
  );
}