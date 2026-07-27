"use client";
import { useEffect, useRef } from "react";

/**
 * Parallax خفيف مقنن: يحرك خلفية العنصر عموديًا بنسبة من موقعه في الشاشة
 * (--parallax-y في globals.css). rAF يعمل فقط أثناء ظهور العنصر فعليًا
 * (IntersectionObserver) — لا حلقة لا نهائية تستهلك المعالج خارج الشاشة.
 * معطّل بالكامل عند prefers-reduced-motion.
 */
export function useParallax<T extends HTMLElement>(strength = 0.12) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const tick = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      el.style.setProperty("--parallax-y", `${(-centerOffset * strength).toFixed(1)}px`);
      raf = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [strength]);

  return ref;
}
