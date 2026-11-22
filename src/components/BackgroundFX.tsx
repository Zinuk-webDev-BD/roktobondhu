"use client";

import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; r: number; warm: boolean; a: number; tw: number };
type Drop = { x: number; y: number; vy: number; s: number; a: number; sway: number; ph: number };
type Ripple = { x: number; y: number; t0: number };

export default function BackgroundFX() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const LINK = 170;
    const MOUSE_LINK = 200;
    let w = 0;
    let h = 0;
    let raf = 0;
    let pts: P[] = [];
    let bokeh: P[] = [];
    let drops: Drop[] = [];
    const ripples: Ripple[] = [];
    const mouse = { x: -9999, y: -9999 };

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const makeP = (big: boolean): P => ({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.35, 0.35) * (big ? 0.5 : 1),
      vy: rand(-0.35, 0.35) * (big ? 0.5 : 1),
      r: big ? rand(30, 80) : rand(1, 2.8),
      warm: Math.random() < 0.4,
      a: big ? rand(0.1, 0.2) : rand(0.6, 1),
      tw: rand(0, Math.PI * 2),
    });

    const makeDrop = (initial: boolean): Drop => ({
      x: rand(0, w),
      y: initial ? rand(0, h) : h + 40,
      vy: rand(0.3, 0.7),
      s: rand(6, 13),
      a: rand(0.3, 0.55),
      sway: rand(10, 26),
      ph: rand(0, Math.PI * 2),
    });

    const move = (p: P) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -40) p.x = w + 40;
      if (p.x > w + 40) p.x = -40;
      if (p.y < -40) p.y = h + 40;
      if (p.y > h + 40) p.y = -40;
    };

    const drawDrop = (d: Drop, t: number) => {
      const x = d.x + Math.sin(t * 0.0008 + d.ph) * d.sway;
      const y = d.y;
      const s = d.s;
      const fade = Math.max(0, Math.min(1, y / 160, (h + 40 - y) / 80));
      const alpha = d.a * fade;
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.shadowColor = `rgba(255,70,90,${alpha})`;
      ctx.shadowBlur = 16;
      ctx.fillStyle = `rgba(230,50,68,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, y - s * 1.5);
      ctx.bezierCurveTo(x + s * 0.25, y - s * 0.9, x + s, y - s * 0.3, x + s, y + s * 0.35);
      ctx.arc(x, y + s * 0.35, s, 0, Math.PI, false);
      ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.25, y - s * 0.9, x, y - s * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // নরম ঝাপসা বৃত্ত
      for (const b of bokeh) {
        if (!reduce) move(b);
        const c = b.warm ? "255,110,125" : "120,165,255";
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(${c},${b.a})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // রক্তের ফোঁটা: নিচ থেকে ওপরে ভাসে
      for (const d of drops) {
        if (!reduce) {
          d.y -= d.vy;
          if (d.y < -40) Object.assign(d, makeDrop(false));
        }
        drawDrop(d, t);
      }

      // বিন্দু সরে যায়, মাউস কাছে এলে দূরে ঠেলে দেয়
      if (!reduce) {
        for (const p of pts) {
          move(p);
          const mx = p.x - mouse.x;
          const my = p.y - mouse.y;
          const md2 = mx * mx + my * my;
          if (md2 < 110 * 110 && md2 > 1) {
            const md = Math.sqrt(md2);
            p.x += (mx / md) * 0.9;
            p.y += (my / md) * 0.9;
          }
        }
      }

      // বিন্দুর মধ্যে রেখা
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const alpha = (1 - Math.sqrt(d2) / LINK) * 0.55;
            const c = pts[i].warm && pts[j].warm ? "255,120,135" : "150,185,255";
            ctx.strokeStyle = `rgba(${c},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        // মাউসের সঙ্গে রেখা
        const mx = pts[i].x - mouse.x;
        const my = pts[i].y - mouse.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md < MOUSE_LINK) {
          ctx.strokeStyle = `rgba(255,138,147,${(1 - md / MOUSE_LINK) * 0.75})`;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // বিন্দু (মিটমিট করে, বড়গুলোর চারপাশে আভা)
      for (const p of pts) {
        const tw = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 0.003 + p.tw);
        const col = p.warm ? "255,138,147" : "220,232,255";
        if (p.r > 1.8) {
          ctx.fillStyle = `rgba(${col},${p.a * tw * 0.14})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${col},${p.a * tw})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ক্লিকের বলয়
      const now = performance.now();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const age = (now - ripples[i].t0) / 900;
        if (age >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(255,138,147,${(1 - age) * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripples[i].x, ripples[i].y, age * 170, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(170, Math.floor((w * h) / 9000));
      pts = Array.from({ length: n }, () => makeP(false));
      bokeh = Array.from({ length: 10 }, () => makeP(true));
      drops = Array.from({ length: Math.max(5, Math.floor(w / 220)) }, () => makeDrop(true));
      if (reduce) draw(0);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onClick = (e: MouseEvent) => {
      if (!reduce) ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    };

    resize();
    if (!reduce) raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}