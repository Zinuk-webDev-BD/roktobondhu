import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { donorEligibility } from "@/lib/blood";
import { bloodGroupLabel } from "@/lib/validation";
import RequestsManager from "@/components/RequestsManager";
import OpenRequestsBoard from "@/components/OpenRequestsBoard";

export const metadata = { title: "রক্তের অনুরোধ | রক্তবন্ধু" };

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "DONOR") {
    const profile = await db.donorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return <p className="text-slate">আপনার দাতা প্রোফাইল পাওয়া যায়নি।</p>;
    const el = donorEligibility(profile);
    return (
      <>
        <h1 className="enter-zoom text-3xl font-bold">খোলা অনুরোধ</h1>
        <p className="enter-right mt-2 max-w-2xl text-slate">যে রোগীদের রক্ত আপনি দিতে পারেন, তাদের জরুরি অনুরোধ।</p>
        <OpenRequestsBoard eligible={el.eligible} reasons={el.reasons} groupLabel={bloodGroupLabel[profile.bloodGroup]} />
      </>
    );
  }

  return (
    <>
      <h1 className="enter-zoom text-3xl font-bold">{user.role === "ADMIN" ? "সব অনুরোধ" : "রক্তের অনুরোধ"}</h1>
      <p className="enter-right mt-2 max-w-2xl text-slate">
        {user.role === "ADMIN" ? "সব হাসপাতালের অনুরোধ এক জায়গায়।" : "রোগীর জন্য রক্তের অনুরোধ তৈরি করুন ও অবস্থা দেখুন।"}
      </p>
      <RequestsManager role={user.role} />
    </>
  );
}