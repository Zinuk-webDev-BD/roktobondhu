import type { RequestStatus } from "./labels";

export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  PENDING: ["MATCHED", "CANCELLED", "EXPIRED"],
  MATCHED: ["FULFILLED", "CANCELLED"],
  FULFILLED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export const canTransition = (from: RequestStatus, to: RequestStatus) => TRANSITIONS[from].includes(to);

// এই অবস্থায় থাকা অনুরোধ মোছা যায় (বরাদ্দ হওয়া বা সম্পন্ন অনুরোধ নয়)
export const DELETABLE: RequestStatus[] = ["PENDING", "CANCELLED", "EXPIRED"];