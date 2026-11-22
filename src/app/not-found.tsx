import Link from "next/link";

export const metadata = { title: "পেজ পাওয়া যায়নি | রক্তবন্ধু" };

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <svg viewBox="0 0 24 24" className="enter-up h-14 w-14" aria-hidden="true">
        <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" fill="#D12F3C" />
      </svg>
      <p className="enter-zoom mt-4 text-6xl font-bold text-blood-text" style={{ animationDelay: "100ms" }}>
        ৪০৪
      </p>
      <h1 className="enter-up mt-3 text-2xl font-bold" style={{ animationDelay: "200ms" }}>
        পেজটি পাওয়া যায়নি
      </h1>
      <p className="enter-up mt-2 text-slate" style={{ animationDelay: "300ms" }}>
        লিংকটি ভুল হতে পারে, অথবা পেজটি সরে গেছে।
      </p>
      <Link href="/dashboard" className="btn enter-up mt-6" style={{ animationDelay: "400ms" }}>
        স্টক বোর্ডে ফিরুন
      </Link>
    </main>
  );
}