export const DAY = 24 * 60 * 60 * 1000;

export const bn = (n: number) => n.toLocaleString("bn-BD");

export function daysLeft(d: string | Date) {
  const t = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  return Math.ceil((t - Date.now()) / DAY);
}

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });

export const bnDigits = (s: string) => s.replace(/\d/g, (c) => "০১২৩৪৫৬৭৮৯"[Number(c)]);

export function toInputDate(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}