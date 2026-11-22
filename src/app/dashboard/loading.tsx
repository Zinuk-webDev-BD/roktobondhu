export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">লোড হচ্ছে...</span>
      <div className="h-5 w-40 animate-pulse rounded bg-surface" />
      <div className="mt-3 h-9 w-72 animate-pulse rounded bg-surface" />
      <div className="mt-8 space-y-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}