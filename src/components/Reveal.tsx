"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { bn } from "@/lib/format";

type Variant = "left" | "right" | "up" | "zoom" | "zoomout";

// স্ক্রলে চোখের সামনে এলে ভেতরের অংশ ভেসে আসে
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${shown ? `enter-${variant}` : "reveal-hidden"} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// সংখ্যা দেখা গেলে ০ থেকে গুনে ওঠে
export function Stat({ value, unit, label }: { value: number; unit: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      setN(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / 1200, 1);
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <div ref={ref} className="card rounded-lg border border-line bg-surface p-5 text-center">
      <p className="text-3xl font-bold text-blood-text">
        <span aria-hidden="true">{bn(n)}</span>
        <span className="sr-only">{bn(value)}</span>
        <span className="text-lg font-medium text-slate"> {unit}</span>
      </p>
      <p className="mt-1 text-slate">{label}</p>
    </div>
  );
}