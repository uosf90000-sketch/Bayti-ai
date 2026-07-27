"use client";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

const CAPTIONS = ["نفهم المساحة", "نوزع الحركة", "نختار الإضاءة", "نضع كل قطعة في مكانها", "ثم نحسب أثرها على ميزانيتك"];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const stage = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

/** أهم مشهد في الصفحة: غرفة فارغة تُبنى تدريجيًا أمام المستخدم أثناء التمرير — SVG مرحلي حقيقي، لا عنصر وهمي منخفض الجودة */
export function RoomBuildScene() {
  const root = useRef<HTMLDivElement>(null);
  const [captionIndex, setCaptionIndex] = useState(0);

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layers = {
      walls: gsap.utils.toArray<SVGElement>(".rb-walls"),
      floor: gsap.utils.toArray<SVGElement>(".rb-floor"),
      window: gsap.utils.toArray<SVGElement>(".rb-window"),
      light: gsap.utils.toArray<SVGElement>(".rb-light"),
      sofa: gsap.utils.toArray<SVGElement>(".rb-sofa"),
      table: gsap.utils.toArray<SVGElement>(".rb-table"),
      curtains: gsap.utils.toArray<SVGElement>(".rb-curtains"),
      accessories: gsap.utils.toArray<SVGElement>(".rb-accessories"),
    };
    const all = Object.values(layers).flat();

    if (reduced) {
      gsap.set(all, { opacity: 1, scale: 1, y: 0 });
      setCaptionIndex(CAPTIONS.length - 1);
      return;
    }
    gsap.set(all, { opacity: 0 });
    gsap.set([...layers.sofa, ...layers.table, ...layers.curtains, ...layers.accessories], { transformOrigin: "50% 100%" });

    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "+=280%",
      scrub: 0.4,
      pin: true,
      onUpdate(self) {
        const p = self.progress;
        gsap.set(layers.walls, { opacity: stage(p, 0, 0.1) });
        gsap.set(layers.floor, { opacity: stage(p, 0.08, 0.16) });
        gsap.set(layers.window, { opacity: stage(p, 0.15, 0.24) });
        gsap.set(layers.light, { opacity: stage(p, 0.32, 0.46) });
        gsap.set(layers.sofa, { opacity: stage(p, 0.46, 0.58), scale: 0.85 + stage(p, 0.46, 0.58) * 0.15 });
        gsap.set(layers.table, { opacity: stage(p, 0.56, 0.66), scale: 0.85 + stage(p, 0.56, 0.66) * 0.15 });
        gsap.set(layers.curtains, { opacity: stage(p, 0.65, 0.75) });
        gsap.set(layers.accessories, { opacity: stage(p, 0.76, 0.9), scale: 0.85 + stage(p, 0.76, 0.9) * 0.15 });

        const idx = Math.min(CAPTIONS.length - 1, Math.floor(p * CAPTIONS.length));
        setCaptionIndex(idx);
      },
    });
  }, { scope: root });

  return (
    <section id="experience" ref={root} className="hp2-scene" style={{ minHeight: "100svh" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner">
        <div className="hp2-room-visual">
          <svg viewBox="0 0 800 500" fill="none">
            {/* جدران */}
            <g className="rb-walls">
              <rect x="0" y="0" width="800" height="380" fill="var(--surface)" />
              <line x1="0" y1="0" x2="800" y2="0" stroke="var(--line-strong)" strokeWidth="2" />
            </g>
            {/* أرضية */}
            <g className="rb-floor"><rect x="0" y="380" width="800" height="120" fill="var(--surface-2)" /></g>
            {/* نافذة */}
            <g className="rb-window">
              <rect x="580" y="60" width="160" height="220" rx="6" fill="color-mix(in srgb, var(--accent) 18%, var(--bg-2))" stroke="var(--line-strong)" strokeWidth="2" />
              <line x1="660" y1="60" x2="660" y2="280" stroke="var(--line-strong)" strokeWidth="1.5" />
            </g>
            {/* إضاءة */}
            <g className="rb-light">
              <circle cx="660" cy="170" r="120" fill="var(--accent)" opacity="0.14" />
              <circle cx="200" cy="40" r="10" fill="var(--accent)" />
              <line x1="200" y1="0" x2="200" y2="30" stroke="var(--line-strong)" strokeWidth="2" />
            </g>
            {/* ستائر */}
            <g className="rb-curtains">
              <rect x="555" y="50" width="26" height="240" rx="10" fill="var(--surface)" opacity="0.9" />
              <rect x="742" y="50" width="26" height="240" rx="10" fill="var(--surface)" opacity="0.9" />
            </g>
            {/* أريكة */}
            <g className="rb-sofa">
              <rect x="60" y="290" width="280" height="90" rx="18" fill="var(--accent-deep)" />
              <rect x="60" y="270" width="280" height="30" rx="14" fill="var(--accent-deep)" />
              <rect x="40" y="270" width="30" height="110" rx="10" fill="var(--accent-deep)" />
              <rect x="330" y="270" width="30" height="110" rx="10" fill="var(--accent-deep)" />
            </g>
            {/* طاولة */}
            <g className="rb-table">
              <ellipse cx="440" cy="400" rx="90" ry="16" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="1.5" />
              <rect x="420" y="380" width="40" height="14" rx="4" fill="var(--accent)" opacity="0.7" />
            </g>
            {/* نباتات وإكسسوارات */}
            <g className="rb-accessories">
              <rect x="500" y="330" width="18" height="50" rx="4" fill="var(--surface-2)" />
              <circle cx="509" cy="320" r="26" fill="var(--accent)" opacity="0.55" />
              <rect x="150" y="230" width="60" height="40" rx="4" fill="var(--surface-2)" opacity="0.8" />
            </g>
          </svg>
        </div>
        <p className="hp2-room-caption">{CAPTIONS[captionIndex]}</p>
        <div className="hp2-room-progress" aria-hidden>
          {CAPTIONS.map((_, i) => <span key={i} className="seg" data-on={i <= captionIndex} />)}
        </div>
      </div>
    </section>
  );
}
