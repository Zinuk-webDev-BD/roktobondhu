import { z } from "zod";
import { bloodGroups } from "./validation";
import { bn } from "./format";
import { MAX_DAYS, MAX_UNITS, urgencyLabel, type Urgency } from "./labels";

export const urgencies = ["NORMAL", "URGENT", "CRITICAL"] as const;
export const requestStatuses = ["PENDING", "MATCHED", "FULFILLED", "CANCELLED", "EXPIRED"] as const;

const base = z.object({
  patientName: z.string().trim().min(2, "রোগীর নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(80, "নাম ৮০ অক্ষরের বেশি হতে পারবে না"),
  bloodGroup: z.enum(bloodGroups, { errorMap: () => ({ message: "রক্তের গ্রুপ বেছে নিন" }) }),
  units: z.coerce
    .number({ invalid_type_error: "ব্যাগের সংখ্যা দিন" })
    .int("পূর্ণ সংখ্যা দিন")
    .min(1, "কমপক্ষে ১টি ব্যাগ দিন")
    .max(MAX_UNITS, `একবারে সর্বোচ্চ ${bn(MAX_UNITS)}টি ব্যাগ চাওয়া যাবে`),
  urgency: z.enum(urgencies, { errorMap: () => ({ message: "জরুরি মাত্রা বেছে নিন" }) }),
  district: z.string().trim().min(2, "জেলার নাম দিন").max(60),
  note: z.string().trim().max(300, "নোট ৩০০ অক্ষরের বেশি হতে পারবে না").optional(),
  expiresAt: z.string().min(1, "কবে পর্যন্ত রক্ত লাগবে তা দিন"),
});

// বহু-শর্তের নিয়ম: জরুরি মাত্রা যত বেশি, মেয়াদ তত কম
function expiryRule(v: { urgency: Urgency; expiresAt: string }, ctx: z.RefinementCtx) {
  const t = Date.parse(`${v.expiresAt}T23:59:59`);
  if (Number.isNaN(t)) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "সঠিক তারিখ দিন" });
    return;
  }
  if (t <= Date.now()) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "তারিখ আজ বা আজকের পরের হতে হবে" });
    return;
  }
  const limit = new Date();
  limit.setDate(limit.getDate() + MAX_DAYS[v.urgency]);
  limit.setHours(23, 59, 59, 999);
  if (t > limit.getTime()) {
    ctx.addIssue({
      code: "custom",
      path: ["expiresAt"],
      message: `${urgencyLabel[v.urgency]} অনুরোধের মেয়াদ সর্বোচ্চ ${bn(MAX_DAYS[v.urgency])} দিন হতে পারে`,
    });
  }
}

export const requestCreateSchema = base.superRefine(expiryRule);
export const requestEditSchema = base.pick({ units: true, urgency: true, note: true, expiresAt: true }).superRefine(expiryRule);

export const requestQuerySchema = z.object({
  status: z.enum(requestStatuses).optional(),
  group: z.enum(bloodGroups).optional(),
  urgency: z.enum(urgencies).optional(),
  q: z.string().trim().max(60).optional(),
  sort: z.enum(["urgency", "created", "expires"]).default("urgency"),
  order: z.enum(["asc", "desc"]).default("desc"),
});