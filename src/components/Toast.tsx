"use client";

export function FormMessage({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-md px-3 py-2 text-sm ${kind === "error" ? "bg-blood-soft text-blood-dark" : "bg-green-50 text-ok"}`}
    >
      {children}
    </p>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-blood-dark">
      {message}
    </p>
  );
}