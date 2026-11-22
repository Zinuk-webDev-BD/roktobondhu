import { z } from "zod";
import { bloodGroups } from "./validation";

const DAY = 24 * 60 * 60 * 1000;
export const MAX_SHELF_DAYS = 42;

export const bagCreateSchema = z
  .object({
    bloodGroup: z.enum(bloodGroups, { errorMap: () => ({ message: "রক্তের গ্রুপ বেছে নিন" }) }),
    quantity: z.coerce
      .number({ invalid_type_error: "সংখ্যা দিন" })
      .int("পূর্ণ সংখ্যা দিন")
      .min(1, "কমপক্ষে ১টি ব্যাগ দিন")
      .max(50, "একবারে সর্বোচ্চ ৫০টি ব্যাগ যোগ করা যাবে"),
    expiryDate: z.string().min(1, "মেয়াদের তারিখ দিন"),
  })
  .superRefine((v, ctx) => {
    const t = Date.parse(v.expiryDate);
    if (Number.isNaN(t)) {
      ctx.addIssue({ code: "custom", path: ["expiryDate"], message: "সঠিক তারিখ দিন" });
      return;
    }
    const now = Date.now();
    if (t <= now) {
      ctx.addIssue({ code: "custom", path: ["expiryDate"], message: "মেয়াদ আজকের পরের তারিখ হতে হবে" });
    } else if (t > now + MAX_SHELF_DAYS * DAY) {
      ctx.addIssue({
        code: "custom",
        path: ["expiryDate"],
        message: `রক্তের ব্যাগের মেয়াদ সর্বোচ্চ ${MAX_SHELF_DAYS} দিন হতে পারে`,
      });
    }
  });

export const bagQuerySchema = z.object({
  group: z.enum(bloodGroups).optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "USED", "EXPIRED"]).optional(),
  sort: z.enum(["expiry", "created"]).default("expiry"),
  order: z.enum(["asc", "desc"]).default("asc"),
});