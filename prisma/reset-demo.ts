import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// শুধু ডেমো ডেটা মোছে (বরাদ্দ, সাড়া, অনুরোধ, ব্যাগ, অডিট লগ)। ব্যবহারকারী ও পাসওয়ার্ড অক্ষত থাকে।
async function main() {
  await db.$transaction([
    db.allocation.deleteMany(),
    db.donationOffer.deleteMany(),
    db.bloodRequest.deleteMany(),
    db.bloodBag.deleteMany(),
    db.auditLog.deleteMany(),
  ]);
  console.log("ডেমো ডেটা মোছা হয়েছে। এখন npm run db:seed চালান।");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());