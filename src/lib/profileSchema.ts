import { z } from "zod";

export const profileUpdateSchema = z
  .object({
    weightKg: z.coerce
      .number({ invalid_type_error: "ওজন সংখ্যায় দিন" })
      .int("পূর্ণ সংখ্যা দিন")
      .min(30, "ওজন সঠিক নয়")
      .max(250, "ওজন সঠিক নয়"),
    district: z.string().trim().min(2, "জেলার নাম দিন").max(60),
    phone: z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/, "সঠিক বাংলাদেশি মোবাইল নম্বর দিন"),
    lastDonationDate: z.string().optional(),
    isAvailable: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.lastDonationDate) return;
    const t = Date.parse(`${v.lastDonationDate}T12:00:00`);
    if (Number.isNaN(t) || t > Date.now()) {
      ctx.addIssue({ code: "custom", path: ["lastDonationDate"], message: "আজকের বা আগের তারিখ দিন" });
    }
  });