"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { AGENTS } from "@/lib/mock";

/** 13 خبيرًا يظهرون واحدًا واحدًا بحجم ضخم أثناء التمرير المثبَّت، ثم يندمجون في خلاصة واحدة — لا شارات صغيرة */
export function CouncilScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // فهرس محدد لأدوار الخبراء وحدهم — يستثني ملخص "hp2-council-final" عمدًا لتفادي تضارب التحريك عليه مرتين
    const roles = gsap.utils.toArray<HTMLElement>(".hp2-council-agent");
    if (reduced) {
      gsap.set(".hp2-council-final", { opacity: 1, y: 0 });
      return;
    }
    gsap.set(roles, { opacity: 0 });
    gsap.set(".hp2-council-final", { opacity: 0, y: 14 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: `+=${roles.length * 26}%`, scrub: 0.5, pin: true },
    });
    roles.forEach((el) => {
      tl.to(el, { opacity: 1, duration: 0.4 }).to(el, { opacity: 0, duration: 0.4 }, "+=0.3");
    });
    tl.to(".hp2-council-final", { opacity: 1, y: 0, duration: 0.6 });
  }, { scope: root });

  return (
    <section ref={root} className="hp2-scene" style={{ minHeight: "100svh" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner">
        <h2 className="hp2-display" style={{ fontSize: "clamp(32px, 6vw, 68px)" }}>
          <span className="line">13 خبيرًا.</span>
          <span className="line gold">قرار واحد متكامل.</span>
        </h2>
        <div className="hp2-council-track">
          {AGENTS.map((a, i) => (
            <div key={a.id} className="hp2-council-role hp2-council-agent">
              <span className="num num">{String(i + 1).padStart(2, "0")} / {AGENTS.length}</span>
              <span className="name">{a.name}</span>
            </div>
          ))}
          <div className="hp2-council-role hp2-council-final" style={{ opacity: 0, transform: "translateY(14px)" }}>
            <span className="name" style={{ fontSize: "clamp(26px, 5vw, 48px)" }}>كلهم يعملون على منزلك في الوقت نفسه.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
