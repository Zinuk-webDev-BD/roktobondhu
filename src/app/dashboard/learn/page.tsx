import InfoSections from "@/components/InfoSections";
import { Faq } from "@/components/MoreInfo";
import PageIntro from "@/components/PageIntro";
import OtherPages from "@/components/OtherPages";

export const metadata = { title: "রক্ত সম্পর্কে জানুন | রক্তবন্ধু" };

export default function LearnPage() {
  return (
    <>
      <PageIntro
        title="রক্ত সম্পর্কে জানুন"
        lead="রক্তের উপাদান, দানের ধাপ, কারা দিতে পারেন আর প্রচলিত ভুল ধারণার সত্যটা এক জায়গায়।"
      />
      <InfoSections />
      <Faq />
      <OtherPages current="/dashboard/learn" />
    </>
  );
}