"use client";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";

const STEPS = [
  { n: "01", t: "ارفع مخططك", d: "PDF أو صورة — بيتي يقرأ الجدران والأبواب والنوافذ فعليًا." },
  { n: "02", t: "اختر أسلوبك وميزانيتك", d: "نمط واضح ورقم صريح — كل قرار لاحق يُقاس عليهما." },
  { n: "03", t: "استكشف منزلك", d: "جولة كاملة غرفة بغرفة، بتصميم مبرَّر لكل قطعة." },
  { n: "04", t: "عدّل ما تريد", d: "بجملة واحدة — التصميم والتكلفة يتحدثان أمامك فورًا." },
  { n: "05", t: "احصل على قائمة التنفيذ والشراء", d: "منتجات حقيقية بروابط شراء وتكلفة نهائية واضحة." },
];

export function HowItWorksScene() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(() => {
    const steps = gsap.utils.toArray<HTMLElement>(".hp2-step");
    steps.forEach((el, i) => {
      ScrollTrigger.create({ trigger: el, start: "top center", end: "bottom center", onToggle: (self) => { if (self.isActive) setActive(i); } });
    });
  }, { scope: root });

  return (
    <section id="how" ref={root} className="hp2-scene" style={{ minHeight: "auto", paddingBlock: "clamp(80px, 12vh, 140px)" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner" style={{ maxWidth: 1100 }}>
        <h2 className="hp2-display" style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: 30 }}>كيف يعمل بيتي</h2>
        <div className="hp2-steps">
          <div>
            {STEPS.map((s) => (
              <div key={s.n} className="hp2-step" style={{ textAlign: "start" }}>
                <div className="n num">{s.n}</div>
                <div className="t">{s.t}</div>
                <p className="d">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="hp2-steps-visual">
            <div className="hp2-atmosphere" style={{ position: "absolute" }} />
            <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
              <span className="num gold" style={{ fontSize: 64, fontWeight: 800 }}>{STEPS[active]!.n}</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{STEPS[active]!.t}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
