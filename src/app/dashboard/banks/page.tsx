import BloodBankDirectory from "@/components/BloodBankDirectory";
import PageIntro from "@/components/PageIntro";
import OtherPages from "@/components/OtherPages";
import Reveal from "@/components/Reveal";

export const metadata = { title: "ব্লাড সেন্টার | রক্তবন্ধু" };

export default function BanksPage() {
  return (
    <>
      <PageIntro title="জেলাভিত্তিক ব্লাড সেন্টার" lead="জেলা বেছে নিন। ফোনের বাটনে চাপলে সরাসরি কল হবে।" />
      <Reveal variant="up" delay={250} className="mt-8">
        <BloodBankDirectory />
      </Reveal>
      <OtherPages current="/dashboard/banks" />
    </>
  );
}