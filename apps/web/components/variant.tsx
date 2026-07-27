"use client";
import { useEffect, useRef, useState } from "react";
import { VARIANTS, type VariantId } from "@/lib/shop";

/** مبدّل النسخ الثلاث — لحظة W4: التحول الفوري (≤ 1 ث بالعقد المجمد) */
export function VariantSwitcher({ value, onChange }: { value: VariantId; onChange: (v: VariantId) => void }) {
  return (
    <div
      role="tablist" aria-label="نسخة التصميم"
      className="card" style={{ display: "flex", padding: 6, gap: 6, borderRadius: "var(--r-control)" }}
    >
      {VARIANTS.map((v) => {
        const active = v.id === value;
        return (
          <button
            key={v.id} role="tab" aria-selected={active}
            onClick={() => onChange(v.id)}
            className="btn" style={{
              flex: 1, minHeight: 54, padding: "0 8px", fontSize: 14.5, flexDirection: "column", gap: 2,
              background: active ? "linear-gradient(135deg, var(--accent), var(--accent-strong))" : "transparent",
              color: active ? "var(--on-accent)" : "var(--text-2)",
              boxShadow: active ? "var(--shadow-soft)" : "none",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 14.5 }}>{v.icon} {v.label}</span>
            <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.8 }}>{v.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

/** عدّاد رقمي متحرك — يحترم reduced-motion (يقفز مباشرة للقيمة) */
export function useCountUp(target: number, ms = 450): number {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduced = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || from.current === target) { from.current = target; setVal(target); return; }
    const start = performance.now(); const f = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(f + (target - f) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}
