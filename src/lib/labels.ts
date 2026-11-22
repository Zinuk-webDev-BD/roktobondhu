export type RequestStatus = "PENDING" | "MATCHED" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type Urgency = "NORMAL" | "URGENT" | "CRITICAL";

export const statusLabel: Record<RequestStatus, string> = {
  PENDING: "অপেক্ষমাণ",
  MATCHED: "ব্যাগ বরাদ্দ হয়েছে",
  FULFILLED: "সম্পন্ন",
  CANCELLED: "বাতিল",
  EXPIRED: "মেয়াদ শেষ",
};

export const statusStyle: Record<RequestStatus, string> = {
  PENDING: "bg-warn-soft text-warn",
  MATCHED: "bg-blood-soft text-blood-text",
  FULFILLED: "bg-ok-soft text-ok",
  CANCELLED: "bg-raised text-slate",
  EXPIRED: "bg-raised text-slate",
};

export const urgencyLabel: Record<Urgency, string> = {
  NORMAL: "সাধারণ",
  URGENT: "জরুরি",
  CRITICAL: "অতি জরুরি",
};

// জরুরি মাত্রা অনুযায়ী অনুরোধের সর্বোচ্চ মেয়াদ (দিন)
export const MAX_DAYS: Record<Urgency, number> = { CRITICAL: 3, URGENT: 7, NORMAL: 30 };
export const MAX_UNITS = 10;