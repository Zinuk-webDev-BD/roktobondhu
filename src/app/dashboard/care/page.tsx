import { Aftercare } from "@/components/MoreInfo";
import NextDonation from "@/components/NextDonation";
import PageIntro from "@/components/PageIntro";
import OtherPages from "@/components/OtherPages";
import Reveal from "@/components/Reveal";

export const metadata = { title: "দানের পর যত্ন ও পরের দান | রক্তবন্ধু" };

export default function CarePage() {
  return (
    <>
      <PageIntro
        title="দানের পর যত্ন ও পরের দান"
        lead="রক্ত দেওয়ার পর শরীরের যত্ন কীভাবে নেবেন, আর আবার কবে দিতে পারবেন তার হিসাব।"
      />
      <Aftercare />

      <section className="mt-16" aria-labelledby="next-title">
        <Reveal variant="right">
          <h2 id="next-title" className="text-2xl font-bold">
            আমি কবে আবার রক্ত দিতে পারব
          </h2>
          <p className="mt-2 max-w-2xl text-slate">শেষ দানের তারিখ দিন, পরের তারিখ হিসাব করে দেব।</p>
        </Reveal>
        <Reveal variant="zoom" delay={100} className="mt-6">
          <NextDonation />
        </Reveal>
      </section>

      <OtherPages current="/dashboard/care" />
    </>
  );
}