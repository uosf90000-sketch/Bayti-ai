"use client";
import { useEffect, useRef } from "react";

/**
 * يضيف class "in-view" عند دخول العنصر منطقة الرؤية — يُستخدم مع .reveal/.reveal-stagger
 * في globals.css. لا يعمل شيء إضافي عند prefers-reduced-motion (الحالة الثابتة already مرئية بالـ CSS).
 */
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in-view");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("in-view");
            io.unobserve(el);
          }
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}
