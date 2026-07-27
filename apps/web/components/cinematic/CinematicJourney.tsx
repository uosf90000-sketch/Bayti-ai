"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { HouseScene } from "@/components/cinematic/HouseScene";
import { usePerformanceTier } from "@/lib/motion/usePerformanceTier";

const CANVAS_QUALITY = {
  high: { dpr: [1, 2] as [number, number], antialias: true, fog: true },
  balanced: { dpr: [1, 1.5] as [number, number], antialias: true, fog: true },
  lite: { dpr: [1, 1] as [number, number], antialias: false, fog: false },
};

const BEATS = [
  { from: 0.0, to: 0.08, title: "من مخططك الورقي", sub: "إلى بيت يمكنك أن تعيشه قبل تنفيذه" },
  { from: 0.08, to: 0.2, title: "ارفع مخططك", sub: "PDF أو صورة — حتى من كاميرا جوالك" },
  { from: 0.2, to: 0.34, title: "والجدران تنهض من الورق", sub: "كل خط في مخططك يتحوّل إلى جدار حقيقي" },
  { from: 0.34, to: 0.5, title: "بيتك يُبنى أمام عينيك", sub: "" },
  { from: 0.5, to: 0.62, title: "كل غرفة تجد هويتها", sub: "مجلس، معيشة، مطبخ، وغرفة نوم — كل واحدة بشخصيتها" },
  { from: 0.62, to: 0.75, title: "والإضاءة تُضيء التفاصيل", sub: "" },
  { from: 0.75, to: 0.86, title: "والأثاث يدخل مكانه بدقة", sub: "كل قطعة فُحصت هندسيًا — تدخل مكانها فعلًا" },
  { from: 0.86, to: 0.95, title: "كل قطعة منتج حقيقي", sub: "بسعر حقيقي من متاجر سعودية" },
  { from: 0.95, to: 1.01, title: "منزلك… استكشفه بحرّية", sub: "اسحب لتدور حول بيتك" },
];

export function CinematicJourney() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [interactive, setInteractive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tier] = usePerformanceTier();
  const quality = CANVAS_QUALITY[tier];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // بلا حركة مفروضة: المشهد يُعرض مكتملًا وثابتًا فورًا، بلا تثبيت تمرير (pin) ولا كاميرا متحركة
  useEffect(() => {
    if (reducedMotion) {
      progressRef.current = 1;
      setInteractive(true);
      setBeatIndex(0);
    }
  }, [reducedMotion]);

  useGSAP(() => {
    if (reducedMotion) return;
    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      pin: ".cine-pin",
      onUpdate(self) {
        progressRef.current = self.progress;
        setInteractive(self.progress > 0.97);
        setBeatIndex((prev) => {
          const next = BEATS.findIndex((b) => self.progress >= b.from && self.progress < b.to);
          return next === -1 ? prev : next;
        });
      },
    });
    return () => trigger.kill();
  }, { scope: wrapperRef, dependencies: [reducedMotion] });

  const beat = BEATS[beatIndex]!;

  return (
    <div ref={wrapperRef} style={{ position: "relative", height: reducedMotion ? "100dvh" : "700vh" }}>
      <div className="cine-pin" style={{ position: "relative", height: "100dvh", overflow: "hidden", background: "var(--bg)" }}>
        <Canvas
          dpr={quality.dpr}
          camera={{ fov: 42, near: 0.1, far: 100, position: [0, 20, 0.01] }}
          gl={{ antialias: quality.antialias }}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden="true"
        >
          <color attach="background" args={["#0a0f1e"]} />
          {quality.fog && <fog attach="fog" args={["#0a0f1e", 14, 34]} />}
          <HouseScene progressRef={progressRef} />
          {interactive && <OrbitControls enablePan={false} minDistance={3} maxDistance={10} maxPolarAngle={Math.PI / 2.1} />}
        </Canvas>

        <div className="scene-content" style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 22px 64px", pointerEvents: "none" }}>
          <div key={beatIndex} className="anim-fade-up" style={{ textAlign: "center", maxWidth: 720 }}>
            <h2 className="h-display" style={{ fontSize: "clamp(30px, 6vw, 52px)" }}>{beat.title}</h2>
            {beat.sub && <p className="muted h-hero-sub" style={{ marginTop: 10 }}>{beat.sub}</p>}
            {beatIndex === 0 && (
              <div className="row" style={{ justifyContent: "center", marginTop: 24, flexWrap: "wrap", pointerEvents: "auto" }}>
                <span className="chip chip-gold">✦ أول مجلس ذكاء اصطناعي لتصميم المنازل في السعودية</span>
              </div>
            )}
            {(reducedMotion || beatIndex === BEATS.length - 1) && (
              <div className="row" style={{ justifyContent: "center", marginTop: 26, flexWrap: "wrap", pointerEvents: "auto" }}>
                <Link href="/login" className="btn btn-gold" style={{ fontSize: 17, minHeight: 54, padding: "0 34px" }}>
                  ابدأ تصميم منزلك
                </Link>
              </div>
            )}
          </div>
        </div>

        {!reducedMotion && (
          <div className="tour-rail" style={{ position: "absolute", top: 20, insetInlineStart: "50%", transform: "translateX(-50%)", zIndex: 3 }} aria-hidden>
            {BEATS.map((_, i) => (
              <span key={i} className="dot" data-active={i === beatIndex} />
            ))}
          </div>
        )}

        {!reducedMotion && beatIndex === 0 && (
          <div className="scroll-cue" aria-hidden>
            <span>مرّر لتبدأ القصة</span>
            <span className="dot" />
          </div>
        )}
      </div>
    </div>
  );
}
