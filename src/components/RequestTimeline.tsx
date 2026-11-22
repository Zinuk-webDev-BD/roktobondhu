import { statusLabel, type RequestStatus } from "@/lib/labels";
import { bn } from "@/lib/format";

const steps = [
  { key: "PENDING", label: "অনুরোধ জমা" },
  { key: "MATCHED", label: "ব্যাগ বরাদ্দ" },
  { key: "FULFILLED", label: "সম্পন্ন" },
] as const;

type State = "done" | "now" | "todo" | "end";

export default function RequestTimeline({ status }: { status: RequestStatus }) {
  const ended = status === "CANCELLED" || status === "EXPIRED";
  const idx = steps.findIndex((s) => s.key === status);

  const items: { label: string; state: State }[] = steps.map((s, i) => {
    let state: State = "todo";
    if (ended) state = i === 0 ? "done" : "todo";
    else if (status === "FULFILLED" || i < idx) state = "done";
    else if (i === idx) state = "now";
    return { label: s.label, state };
  });
  if (ended) items.push({ label: statusLabel[status], state: "end" });

  const circle: Record<State, string> = {
    done: "bg-ok text-paper",
    now: "bg-blood text-white ring-4 ring-blood/30",
    todo: "border border-line text-slate",
    end: "border border-blood bg-raised text-blood-text",
  };

  return (
    <ol className="flex flex-wrap items-center gap-y-3" aria-label="অনুরোধের অবস্থা">
      {items.map((it, i) => (
        <li key={it.label} className="flex items-center">
          {i > 0 && <span className={`mx-2 h-0.5 w-6 sm:w-12 ${it.state === "todo" ? "bg-line" : "bg-blood"}`} aria-hidden="true" />}
          <span className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${circle[it.state]}`}>
              {it.state === "done" ? "✓" : it.state === "end" ? "✕" : bn(i + 1)}
            </span>
            <span className={it.state === "todo" ? "text-slate" : "font-medium"}>{it.label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}