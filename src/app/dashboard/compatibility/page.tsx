import { getStockSummary } from "@/lib/stock";
import { bloodGroupLabel } from "@/lib/validation";
import CompatExplorer from "@/components/CompatExplorer";
import PageIntro from "@/components/PageIntro";
import OtherPages from "@/components/OtherPages";
import Reveal from "@/components/Reveal";

export const metadata = { title: "কে কাকে রক্ত দিতে পারে | রক্তবন্ধু" };

export default async function CompatibilityPage() {
  const stock = await getStockSummary();
  const groups = stock.rows.map((r) => ({ label: bloodGroupLabel[r.bloodGroup], available: r.available }));

  return (
    <>
      <PageIntro
        title="কে কাকে রক্ত দিতে পারে"
        lead="একটি গ্রুপ বেছে নিন। কোন গ্রুপের সঙ্গে মিলবে আর স্টকে এখন কয়টি ব্যাগ আছে, দুটোই দেখতে পাবেন।"
      />
      <Reveal variant="up" delay={250} className="mt-8">
        <CompatExplorer groups={groups} />
      </Reveal>
      <OtherPages current="/dashboard/compatibility" />
    </>
  );
}