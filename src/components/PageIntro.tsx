import Link from "next/link";

export default function PageIntro({ title, lead }: { title: string; lead: string }) {
  return (
    <>
      <Link href="/dashboard" className="enter-left inline-flex items-center gap-1 text-slate transition-colors hover:text-ink">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        স্টক বোর্ডে ফিরুন
      </Link>
      <h1 className="enter-zoom mt-3 text-3xl font-bold" style={{ animationDelay: "100ms" }}>
        {title}
      </h1>
      <p className="enter-right mt-2 max-w-2xl text-slate" style={{ animationDelay: "200ms" }}>
        {lead}
      </p>
    </>
  );
}