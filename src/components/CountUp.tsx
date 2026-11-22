"use client";

import { useEffect, useState } from "react";
import { bn } from "@/lib/format";

export default function CountUp({ value, delayMs = 0 }: { value: number; delayMs?: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const duration = 900;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, delayMs]);

  return (
    <>
      <span aria-hidden="true">{bn(n)}</span>
      <span className="sr-only">{bn(value)}</span>
    </>
  );
}