"use client";
import { useRef, useState } from "react";

export function BeforeAfterScene() {
  const [pct, setPct] = useState(50);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    // RTL: العنصر after يكشف من اليسار — نعكس النسبة لتطابق اتجاه السحب البصري
    setPct(Math.round(Math.max(0, Math.min(100, (1 - ratio) * 100))));
  };

  return (
    <section className="hp2-scene" style={{ minHeight: "100svh" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner">
        <h2 className="hp2-display" style={{ fontSize: "clamp(28px, 5vw, 52px)" }}>
          <span className="line">لا تتخيل النتيجة.</span>
          <span className="line gold">شاهدها.</span>
        </h2>

        <div
          ref={trackRef} className="hp2-compare"
          onPointerDown={(e) => { dragging.current = true; setFromClientX(e.clientX); }}
          onPointerMove={(e) => { if (dragging.current) setFromClientX(e.clientX); }}
          onPointerUp={() => { dragging.current = false; }}
          onPointerLeave={() => { dragging.current = false; }}
        >
          <div className="hp2-compare-layer" aria-hidden>
            <svg viewBox="0 0 800 500" fill="none" style={{ width: "100%", height: "100%" }}>
              <rect width="800" height="500" fill="var(--bg-2)" />
              <rect x="0" y="0" width="800" height="380" fill="none" stroke="var(--line)" strokeWidth="2" />
              <line x1="0" y1="380" x2="800" y2="380" stroke="var(--line)" strokeWidth="2" />
            </svg>
            <span className="hp2-compare-tag" style={{ insetInlineStart: 16 }}>قبل</span>
          </div>
          <div className="hp2-compare-layer hp2-compare-after" style={{ clipPath: `inset(0 0 0 ${pct}%)` }} aria-hidden>
            <svg viewBox="0 0 800 500" fill="none" style={{ width: "100%", height: "100%" }}>
              <rect width="800" height="500" fill="var(--surface)" />
              <rect x="0" y="380" width="800" height="120" fill="var(--surface-2)" />
              <rect x="580" y="60" width="160" height="220" rx="6" fill="color-mix(in srgb, var(--accent) 18%, var(--bg-2))" stroke="var(--line-strong)" strokeWidth="2" />
              <circle cx="660" cy="170" r="120" fill="var(--accent)" opacity="0.14" />
              <rect x="60" y="290" width="280" height="90" rx="18" fill="var(--accent-deep)" />
              <rect x="60" y="270" width="280" height="30" rx="14" fill="var(--accent-deep)" />
              <ellipse cx="440" cy="400" rx="90" ry="16" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="1.5" />
            </svg>
            <span className="hp2-compare-tag" style={{ insetInlineEnd: 16 }}>بعد</span>
          </div>
          <div className="hp2-compare-handle" style={{ insetInlineStart: `${100 - pct}%` }} />
        </div>
      </div>
    </section>
  );
}
