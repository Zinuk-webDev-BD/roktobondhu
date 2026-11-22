import { statusLabel, statusStyle, urgencyLabel, type RequestStatus, type Urgency } from "@/lib/labels";

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`rounded px-2 py-0.5 text-sm ${statusStyle[status]}`}>{statusLabel[status]}</span>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  if (urgency === "NORMAL") return <span className="text-sm text-slate">{urgencyLabel.NORMAL}</span>;
  const critical = urgency === "CRITICAL";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded px-2 py-0.5 text-sm font-medium ${
        critical ? "bg-blood-soft text-blood-text" : "bg-warn-soft text-warn"
      }`}
    >
      <span className="relative inline-flex h-2 w-2" aria-hidden="true">
        {critical && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood-text opacity-75" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${critical ? "bg-blood-text" : "bg-warn"}`} />
      </span>
      {urgencyLabel[urgency]}
    </span>
  );
}