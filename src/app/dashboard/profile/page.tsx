import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { donorEligibility, RULES } from "@/lib/blood";
import { bloodGroupLabel } from "@/lib/validation";
import { bn, daysLeft, fmtDate, toInputDate } from "@/lib/format";
import CountUp from "@/components/CountUp";
import ProfileForm from "@/components/ProfileForm";

export const metadata = { title: "আমার প্রোফাইল | রক্তবন্ধু" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "DONOR") redirect("/dashboard");

  const profile = await db.donorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return <p className="text-slate">আপনার দাতা প্রোফাইল পাওয়া যায়নি।</p>;

  const el = donorEligibility(profile);

  return (
    <>
      <h1 className="enter-zoom text-3xl font-bold">আমার প্রোফাইল</h1>
      <p className="enter-right mt-2 text-slate">
        {user.name}, রক্তের গ্রুপ {bloodGroupLabel[profile.bloodGroup]}, বয়স {bn(el.age)} বছর
      </p>

      <section
        aria-labelledby="elig-title"
        className={`enter-up mt-8 rounded-lg border p-5 ${el.eligible ? "border-ok/40 bg-ok-soft" : "border-warn/40 bg-warn-soft"}`}
        style={{ animationDelay: "150ms" }}
      >
        <h2 id="elig-title" className={`text-xl font-bold ${el.eligible ? "text-ok" : "text-warn"}`}>
          {el.eligible ? "আপনি এখন রক্ত দিতে পারবেন" : "এই মুহূর্তে আপনি রক্ত দিতে পারছেন না"}
        </h2>
        {!el.eligible && (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {el.reasons.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        {el.nextEligibleDate && (
          <p className="mt-4 text-lg">
            আবার দিতে পারবেন {fmtDate(el.nextEligibleDate)} থেকে, আর{" "}
            <strong className="text-blood-text">
              <CountUp value={daysLeft(el.nextEligibleDate)} />
            </strong>{" "}
            দিন বাকি।
          </p>
        )}
        <p className="mt-4 text-sm text-slate">
          নিয়ম: বয়স {bn(RULES.minAge)}–{bn(RULES.maxAge)} বছর, ওজন কমপক্ষে {bn(RULES.minWeight)} কেজি, দুই দানের মাঝে কমপক্ষে {bn(RULES.gapDays)} দিন।
        </p>
      </section>

      <h2 className="mt-10 text-xl font-semibold">তথ্য বদলান</h2>
      <p className="mt-1 text-sm text-slate">রক্তের গ্রুপ ও জন্মতারিখ এখানে বদলানো যায় না। ভুল থাকলে অ্যাডমিনকে জানান।</p>
      <div className="mt-4">
        <ProfileForm
          defaults={{
            weightKg: profile.weightKg,
            district: profile.district,
            phone: profile.phone,
            lastDonationDate: profile.lastDonationDate ? toInputDate(profile.lastDonationDate) : "",
            isAvailable: profile.isAvailable,
          }}
        />
      </div>
    </>
  );
}