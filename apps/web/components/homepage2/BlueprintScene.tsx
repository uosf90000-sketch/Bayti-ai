"use client";
import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

const ROOMS = [
  { x: 140, y: 220, label: "مجلس الرجال" },
  { x: 430, y: 220, label: "المعيشة" },
  { x: 140, y: 470, label: "المطبخ" },
  { x: 430, y: 470, label: "غرفة النوم" },
];

export function BlueprintScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const walls = gsap.utils.toArray<SVGPathElement>(".hp2-bp-wall");
    walls.forEach((w) => { const len = w.getTotalLength(); w.style.strokeDasharray = `${len}`; w.style.strokeDashoffset = reduced ? "0" : `${len}`; });

    if (reduced) {
      gsap.set(".hp2-bp-label", { opacity: 1 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: "+=140%", scrub: 0.5, pin: true },
    });
    tl.to(walls, { strokeDashoffset: 0, duration: 1, ease: "none", stagger: 0.15 })
      .to(".hp2-bp-label", { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, "-=0.3")
      .to(".hp2-bp-svg-wrap", { scale: 1.35, x: -60, y: -30, duration: 0.8, ease: "power2.inOut" })
      .to(".hp2-bp-svg-wrap", { opacity: 0.15, duration: 0.3 }, "-=0.1");
  }, { scope: root });

  return (
    <section id="blueprint" ref={root} className="hp2-scene" style={{ minHeight: "100svh" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner hp2-blueprint-split">
        <div className="hp2-bp-svg-wrap" style={{ position: "relative" }}>
          <h2 className="hp2-display" style={{ fontSize: "clamp(30px, 5vw, 52px)", marginBottom: 10 }}>كل منزل يبدأ بخط</h2>
          <div className="hp2-blueprint-visual">
            <svg viewBox="0 0 600 700" fill="none">
              <path className="hp2-bp-wall" d="M60 60 H540 V640 H60 Z" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" />
              <path className="hp2-bp-wall" d="M60 350 H540 M300 60 V640" stroke="var(--accent-strong)" strokeWidth="2" opacity="0.85" />
              {ROOMS.map((r, i) => (
                <text key={i} className="hp2-bp-label" x={r.x} y={r.y} fill="var(--text)" fontSize="22" fontWeight="700" opacity="0" style={{ transform: "translateY(8px)" }}>
                  {r.label}
                </text>
              ))}
            </svg>
          </div>
        </div>
        <div className="hp2-blueprint-copy">
          <p className="hp2-sub" style={{ margin: 0 }}>
            ارفع مخطط PDF أو صورة، وبيتي يتولى فهم الغرف والأبواب والنوافذ.
          </p>
          <div style={{ marginTop: 24 }}>
            <Link href="/login" className="hp2-btn hp2-btn-solid">ارفع مخططك</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
