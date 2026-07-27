"use client";
import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { InteriorArt } from "@/components/homepage2/InteriorArt";

export function HeroScene() {
  const root = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // دخول: السطر الأول ثم الثاني (reveal) ثم الوصف والأزرار
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hp2-hero-line1", { yPercent: 110, duration: reduced ? 0.01 : 0.9 })
      .from(".hp2-hero-line2", { yPercent: 110, duration: reduced ? 0.01 : 0.9 }, "-=0.6")
      .from(".hp2-hero-sub", { opacity: 0, y: 16, duration: reduced ? 0.01 : 0.6 }, "-=0.35")
      .from(".hp2-hero-actions", { opacity: 0, y: 16, duration: reduced ? 0.01 : 0.6 }, "-=0.4");

    if (reduced) return;

    // خروج مرتبط بالتمرير: الخلفية تتحرك ببطء، النص يكبر ثم يتلاشى
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate(self) {
        gsap.set(bg.current, { yPercent: self.progress * 22, scale: 1 + self.progress * 0.08 });
        gsap.set(".hp2-hero-textblock", { opacity: 1 - self.progress * 1.3, scale: 1 + self.progress * 0.06 });
      },
    });
  }, { scope: root });

  return (
    <section ref={root} className="hp2-scene" style={{ minHeight: "100svh" }}>
      <div className="hp2-scene-bg" ref={bg}>
        <div className="hp2-atmosphere" />
        <InteriorArt variant="majlis" />
      </div>
      <div className="hp2-scene-inner hp2-hero-textblock">
        <h1 className="hp2-display" style={{ overflow: "visible" }}>
          <span className="line" style={{ overflow: "hidden", display: "block" }}>
            <span className="hp2-hero-line1" style={{ display: "block" }}>من مخطط فارغ</span>
          </span>
          <span className="line" style={{ overflow: "hidden", display: "block" }}>
            <span className="hp2-hero-line2 gold" style={{ display: "block" }}>إلى منزل ينبض بالحياة</span>
          </span>
        </h1>
        <p className="hp2-sub hp2-hero-sub">
          بيتي يحلل مخططك، يصمم كل غرفة، ويقترح منتجات حقيقية تناسب ميزانيتك.
        </p>
        <div className="hp2-actions hp2-hero-actions">
          <Link href="/login" className="hp2-btn hp2-btn-solid">ابدأ مشروعك</Link>
          <a href="#blueprint" className="hp2-btn hp2-btn-ghost">شاهد التجربة</a>
        </div>
      </div>
      <div className="hp2-scroll-cue" aria-hidden><span className="bar" /></div>
    </section>
  );
}
