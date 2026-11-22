import "dotenv/config";
import { PrismaClient, BloodGroup } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DEMO_PASSWORD = "Demo1234";

const day = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * day);
const yearsAgo = (n: number) => new Date(Date.now() - n * 365 * day);

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await db.user.upsert({
    where: { email: "admin@roktobondhu.test" },
    update: {},
    create: { name: "সিস্টেম অ্যাডমিন", email: "admin@roktobondhu.test", passwordHash, role: "ADMIN" },
  });

  const hospitals = ["ঢাকা মেডিকেল হাসপাতাল", "চট্টগ্রাম সিটি হাসপাতাল"];
  for (let i = 0; i < hospitals.length; i++) {
    const name = hospitals[i];    const email = `hospital${i + 1}@roktobondhu.test`;
    await db.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash, role: "HOSPITAL" },
    });
  }

  const donors: { name: string; group: BloodGroup; age: number; kg: number; district: string; lastDonationDaysAgo: number | null }[] = [
    { name: "রফিক আহমেদ", group: "O_NEG", age: 29, kg: 68, district: "ঢাকা", lastDonationDaysAgo: 200 },
    { name: "সুমাইয়া ইসলাম", group: "A_POS", age: 24, kg: 55, district: "ঢাকা", lastDonationDaysAgo: null },
    { name: "তানভীর হোসেন", group: "B_POS", age: 33, kg: 74, district: "চট্টগ্রাম", lastDonationDaysAgo: 30 }, // এখনো যোগ্য নয়
    { name: "নুসরাত জাহান", group: "AB_POS", age: 41, kg: 60, district: "সিলেট", lastDonationDaysAgo: 120 },
    { name: "মাহমুদ হাসান", group: "O_POS", age: 17, kg: 58, district: "ঢাকা", lastDonationDaysAgo: null }, // বয়স কম
    { name: "ফারজানা আক্তার", group: "A_NEG", age: 35, kg: 48, district: "রাজশাহী", lastDonationDaysAgo: null }, // ওজন কম
  ];

  for (let i = 0; i < donors.length; i++) {
    const d = donors[i];    const email = `donor${i + 1}@roktobondhu.test`;
    await db.user.upsert({
      where: { email },
      update: {},
      create: {
        name: d.name,
        email,
        passwordHash,
        role: "DONOR",
        donorProfile: {
          create: {
            bloodGroup: d.group,
            dateOfBirth: yearsAgo(d.age),
            weightKg: d.kg,
            district: d.district,
            phone: `01711${100000 + i}`,
            lastDonationDate: d.lastDonationDaysAgo ? daysFromNow(-d.lastDonationDaysAgo) : null,
          },
        },
      },
    });
  }

  // স্টক (ব্যাগ থাকলে আবার বানাবে না)
  if ((await db.bloodBag.count()) === 0) {
    // O- মাত্র ১টি: A05 concurrency টেস্টের "শেষ ব্যাগ"। AB- শূন্য: খালি অবস্থা দেখানোর জন্য
    const plan: Record<BloodGroup, number> = {
      A_POS: 5, A_NEG: 2, B_POS: 4, B_NEG: 1, AB_POS: 3, AB_NEG: 0, O_POS: 6, O_NEG: 1,
    };
    const bags: { bloodGroup: BloodGroup; expiryDate: Date }[] = [];
    for (const g of Object.keys(plan) as BloodGroup[]) {
      for (let k = 0; k < plan[g]; k++) bags.push({ bloodGroup: g, expiryDate: daysFromNow(12 + k * 8) });
    }
    bags.push({ bloodGroup: "B_NEG", expiryDate: daysFromNow(3) }); // শিগগির মেয়াদ শেষ
    bags.push({ bloodGroup: "B_POS", expiryDate: daysFromNow(-2) }); // মেয়াদোত্তীর্ণ: সিস্টেম নিজে বাদ দেবে
    await db.bloodBag.createMany({ data: bags });
  }

  console.log("Seed সম্পন্ন। সব ডেমো অ্যাকাউন্টের পাসওয়ার্ড:", DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());