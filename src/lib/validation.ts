import { z } from "zod";

export const bloodGroups = [
  "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG",
] as const;

export const bloodGroupLabel: Record<(typeof bloodGroups)[number], string> = {
  A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
  AB_POS: "AB+", AB_NEG: "AB-", O_POS: "O+", O_NEG: "O-",
};

const passwordRule = z
  .string()
  .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে")
  .max(72, "পাসওয়ার্ড ৭২ অক্ষরের বেশি হতে পারবে না")
  .regex(/[A-Za-z]/, "পাসওয়ার্ডে অন্তত একটি অক্ষর থাকতে হবে")
  .regex(/[0-9]/, "পাসওয়ার্ডে অন্তত একটি সংখ্যা থাকতে হবে");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন"),
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(80),
    email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন"),
    password: passwordRule,
    role: z.enum(["DONOR", "HOSPITAL"]),
    // কেবল দাতার জন্য
    bloodGroup: z.enum(bloodGroups).optional(),
    dateOfBirth: z.string().optional(),
    weightKg: z.coerce.number().int().min(30, "ওজন সঠিক নয়").max(250, "ওজন সঠিক নয়").optional(),
    district: z.string().trim().min(2).max(60).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^(?:\+?88)?01[3-9]\d{8}$/, "সঠিক বাংলাদেশি মোবাইল নম্বর দিন")
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role !== "DONOR") return;
    const need = (k: "bloodGroup" | "dateOfBirth" | "weightKg" | "district" | "phone", msg: string) => {
      if (v[k] === undefined || v[k] === "") ctx.addIssue({ code: "custom", path: [k], message: msg });
    };
    need("bloodGroup", "রক্তের গ্রুপ বেছে নিন");
    need("dateOfBirth", "জন্মতারিখ দিন");
    need("weightKg", "ওজন দিন");
    need("district", "জেলা দিন");
    need("phone", "মোবাইল নম্বর দিন");
    if (v.dateOfBirth) {
      const dob = new Date(v.dateOfBirth);
      if (Number.isNaN(dob.getTime()) || dob > new Date()) {
        ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "সঠিক জন্মতারিখ দিন" });
      }
    }
  });

/** zod error → { ফিল্ডের নাম: বার্তা } */
export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join(".") || "_";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}