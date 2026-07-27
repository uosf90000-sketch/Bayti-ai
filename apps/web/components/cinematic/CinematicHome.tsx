"use client";

import Link from "next/link";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS, NAJRES_ROOMS, sar } from "@/lib/mock";
import { VARIANTS, SHOP_ITEMS, variantTotal, roomCost, type VariantId } from "@/lib/shop";
import { RoomVisual } from "./RoomVisual";
import "./cinematic-home.css";

const buildStages = [
  "نفهم المساحة",
  "نوزّع الحركة",
  "نختار الإضاءة",
  "نضع كل قطعة في مكانها",
  "ثم نحسب أثرها على ميزانيتك",
];

const processSteps = [
  ["01", "ارفع مخططك", "PDF أو صورة واضحة، وبيتي يبدأ بفهم الغرف والفتحات."],
  ["02", "اختر أسلوبك وميزانيتك", "اقتصادي أو متوازن أو فاخر، مع حرية التعديل لاحقًا."],
  ["03", "استكشف منزلك", "شاهد الغرف والقرارات والمنتجات داخل تجربة بصرية واضحة."],
  ["04", "عدّل ما تريد", "غيّر القطع والخامات والميزانية دون فقدان منطق التصميم."],
  ["05", "احصل على قائمة التنفيذ والشراء", "مقاسات وكميات وروابط ومنتجات قابلة للمراجعة."],
];

/** ثلاثة عناصر تسوق حقيقية من مكتبة المنتجات — بلا أسعار أو منتجات وهمية */
const HOTSPOT_ITEM_IDS = ["sofa_majlis", "chandelier", "tv_unit"] as const;

export function CinematicHome() {
  const root = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [budgetIndex, setBudgetIndex] = useState(1);
  const [compare, setCompare] = useState(56);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  useLayoutEffect(() => {
    const start = performance.now();
    const duration = 1600;
    let frame = 0;

    const tick = (now: number) => {
      const value = Math.min(100, Math.round(((now - start) / duration) * 100));
      setProgress(value);
      if (value < 100) frame = requestAnimationFrame(tick);
      else window.setTimeout(() => setLoading(false), 220);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    if (loading || !root.current) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanup = () => undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]).then(
      ([gsapModule, triggerModule, lenisModule]) => {
        const gsap = gsapModule.gsap;
        const ScrollTrigger = triggerModule.ScrollTrigger;
        const Lenis = lenisModule.default;

        gsap.registerPlugin(ScrollTrigger);

        if (reduced) {
          // نتوقف عن أي حركة مرتبطة بالتمرير ونثبّت الحالة النهائية مباشرة — يحترم prefers-reduced-motion فعليًا لا شكليًا فقط
          gsap.set(".hero-copy > *, .blueprint-copy, .expert-word, .reveal-line, .rv-scroll .rv-light, .rv-scroll .rv-sofa, .rv-scroll .rv-table, .rv-scroll .rv-curtains, .rv-scroll .rv-accessories", {
            opacity: 1,
            y: 0,
            scale: 1,
            clipPath: "inset(0 0 0% 0)",
          });
          return;
        }

        const lenis = new Lenis({
          duration: 1.15,
          smoothWheel: true,
          wheelMultiplier: 0.9,
          touchMultiplier: 1,
        });

        const onScroll = () => ScrollTrigger.update();
        lenis.on("scroll", onScroll);

        let rafId = 0;
        const raf = (time: number) => {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        const context = gsap.context(() => {
          gsap.fromTo(
            ".hero-copy > *",
            { y: 56, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "power3.out" }
          );

          gsap.to(".hero-media", {
            scale: 1.12,
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero-scene",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });

          gsap.to(".hero-copy", {
            scale: 1.06,
            opacity: 0,
            yPercent: -16,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero-scene",
              start: "25% top",
              end: "bottom top",
              scrub: true,
            },
          });

          const blueprintTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: ".blueprint-scene",
              start: "top top",
              end: "+=180%",
              scrub: 1,
              pin: true,
            },
          });

          blueprintTimeline
            .fromTo(".blueprint-image", { opacity: 0, scale: 0.82 }, { opacity: 1, scale: 1, duration: 1 })
            .fromTo(".blueprint-image", { filter: "blur(0px)" }, { filter: "drop-shadow(0 30px 35px rgba(79,52,36,.18))", duration: 0.6 }, "<")
            .to(".blueprint-image", { scale: 1.35, xPercent: -16, yPercent: 8, duration: 1.2 })
            .fromTo(".blueprint-copy", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7 }, "<.25");

          const expertItems = gsap.utils.toArray<HTMLElement>(".expert-word");
          expertItems.forEach((item) => {
            gsap.fromTo(
              item,
              { opacity: 0.08, y: 42, scale: 0.92 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                scrollTrigger: {
                  trigger: item,
                  start: "top 72%",
                  end: "bottom 38%",
                  scrub: true,
                },
              }
            );
          });

          gsap.utils.toArray<HTMLElement>(".reveal-line").forEach((line) => {
            gsap.fromTo(
              line,
              { clipPath: "inset(0 0 100% 0)", y: 34 },
              {
                clipPath: "inset(0 0 0% 0)",
                y: 0,
                scrollTrigger: { trigger: line, start: "top 82%", end: "top 55%", scrub: true },
              }
            );
          });

          // المشهد الأهم: غرفة تُبنى تدريجيًا SVG بدل تبديل صور — نفس منطق stage لكن بلا صور فوتوغرافية
          const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
          const stage = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
          const buildRoot = document.querySelector(".rv-scroll");
          if (buildRoot) {
            const layer = (cls: string) => buildRoot.querySelectorAll(`.${cls}`);
            ScrollTrigger.create({
              trigger: ".build-scene",
              start: "top top",
              end: "+=380%",
              scrub: 0.4,
              pin: true,
              onUpdate(self) {
                const p = self.progress;
                gsap.set(layer("rv-window"), { opacity: stage(p, 0.04, 0.14) });
                gsap.set(layer("rv-light"), { opacity: stage(p, 0.22, 0.36) });
                gsap.set(layer("rv-sofa"), { opacity: stage(p, 0.4, 0.54) });
                gsap.set(layer("rv-table"), { opacity: stage(p, 0.52, 0.64) });
                gsap.set(layer("rv-curtains"), { opacity: stage(p, 0.62, 0.74) });
                gsap.set(layer("rv-accessories"), { opacity: stage(p, 0.76, 0.92) });

                const idx = Math.min(buildStages.length - 1, Math.floor(p * buildStages.length));
                document.querySelectorAll<HTMLElement>(".build-step").forEach((el, i) => {
                  el.style.opacity = i === idx ? "1" : "0";
                });
              },
            });
          }

          ScrollTrigger.refresh();
        }, root);

        cleanup = () => {
          context.revert();
          cancelAnimationFrame(rafId);
          lenis.off("scroll", onScroll);
          lenis.destroy();
        };
      }
    );

    return () => cleanup();
  }, [loading]);

  const variant = VARIANTS[budgetIndex];
  const activeItem = SHOP_ITEMS.find((i) => i.id === activeProductId) ?? null;
  const hotspotItems = HOTSPOT_ITEM_IDS.map((id) => SHOP_ITEMS.find((i) => i.id === id)).filter(
    (i): i is (typeof SHOP_ITEMS)[number] => Boolean(i)
  );

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            className="cinematic-loader"
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="loader-brand">بيتي</div>
            <p>نجهّز لك تجربة مختلفة للسكن</p>
            <strong>{progress}%</strong>
            <div className="loader-track">
              <span style={{ transform: `scaleX(${progress / 100})` }} />
            </div>
            {progress > 60 && (
              <button type="button" onClick={() => setLoading(false)}>
                تجاوز
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={root} className="cinematic-home" dir="rtl">
        <header className="cinematic-nav">
          <Link href="/" className="cinematic-brand">بيتي</Link>
          <nav aria-label="التنقل الرئيسي">
            <a href="#how">كيف يعمل</a>
            <a href="#experience">التجربة</a>
            <a href="#budget">الأسعار</a>
            <Link href="/login">دخول</Link>
          </nav>
          <Link href="/login" className="nav-cta">ابدأ مشروعك</Link>
        </header>

        <main>
          <section className="hero-scene full-scene" id="experience">
            <div className="hero-media">
              <RoomVisual variant="full" className="hero-room-svg" />
            </div>
            <div className="hero-overlay" />
            <div className="hero-copy">
              <p className="eyebrow">منصة تصميم منازل مدعومة بالذكاء الاصطناعي</p>
              <h1>
                <span>من مخطط فارغ</span>
                <span>إلى منزل ينبض بالحياة</span>
              </h1>
              <p className="hero-description">
                بيتي يحلل مخططك، يصمم كل غرفة، ويقترح منتجات حقيقية تناسب ميزانيتك.
              </p>
              <div className="hero-actions">
                <Link href="/login" className="primary-action">ابدأ مشروعك</Link>
                <a href="#blueprint" className="secondary-action">شاهد التجربة</a>
              </div>
            </div>
            <a href="#blueprint" className="scroll-cue" aria-label="مرّر للأسفل">
              <span />
              مرّر لاكتشاف التجربة
            </a>
          </section>

          <section className="blueprint-scene full-scene" id="blueprint">
            <div className="blueprint-canvas">
              <Image
                src="/cinematic/blueprint.svg"
                alt="مخطط منزل يتحول إلى تصميم قابل للفهم"
                fill
                sizes="90vw"
                className="blueprint-image"
              />
            </div>
            <div className="blueprint-copy">
              <p className="eyebrow">الخطوة الأولى</p>
              <h2>كل منزل يبدأ بخط</h2>
              <p>ارفع مخطط PDF أو صورة، وبيتي يتولى فهم الغرف والأبواب والنوافذ.</p>
              <Link href="/login" className="text-action">ارفع مخططك ←</Link>
            </div>
          </section>

          <section className="council-scene">
            <div className="council-intro full-scene">
              <p className="eyebrow">مجلس بيتي</p>
              <h2 className="reveal-line">{AGENTS.length} خبيرًا.</h2>
              <h2 className="reveal-line muted-title">قرار واحد متكامل.</h2>
            </div>
            <div className="expert-stream">
              {AGENTS.map((expert, index) => (
                <div className="expert-word" key={expert.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{expert.name}</strong>
                </div>
              ))}
            </div>
            <div className="council-outro full-scene">
              <p>كلهم يعملون على منزلك في الوقت نفسه.</p>
            </div>
          </section>

          <section className="build-scene" id="how">
            <div className="build-visual">
              <RoomVisual variant="scroll" className="rv-scroll" />
              <div className="build-shade" />
              <div className="build-copy">
                {buildStages.map((stage, index) => (
                  <div className="build-step" key={stage} style={{ opacity: index === 0 ? 1 : 0 }}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h2>{stage}</h2>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="products-scene full-scene">
            <div className="products-visual">
              <RoomVisual variant="full" />
            </div>
            <div className="products-shade" />
            <div className="products-copy">
              <p className="eyebrow">منتجات قابلة للشراء</p>
              <h2>كل قطعة تراها<br />تعرف من أين تشتريها</h2>
              <p>لا صور خيالية ولا مقاسات مجهولة. كل اقتراح مرتبط بمنتج حقيقي ومقاس وسعر متاح.</p>
            </div>
            {hotspotItems.map((item, i) => (
              <button
                key={item.id}
                className={`hotspot hotspot-${["one", "two", "three"][i]}`}
                aria-label={`عرض تفاصيل ${item.title}`}
                onClick={() => setActiveProductId((cur) => (cur === item.id ? null : item.id))}
                type="button"
              >
                <span />
              </button>
            ))}
            <AnimatePresence>
              {activeItem && (
                <motion.aside
                  className="product-sheet"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.3 }}
                >
                  <button type="button" className="sheet-close" onClick={() => setActiveProductId(null)} aria-label="إغلاق">
                    ×
                  </button>
                  <p className="sheet-room">{activeItem.roomName}</p>
                  <strong className="sheet-title">{activeItem.title}</strong>
                  <p className="sheet-spec">{activeItem.spec}</p>
                  <div className="sheet-offer">
                    <span>{activeItem.offers[variant.id].store}</span>
                    <strong>{sar(activeItem.offers[variant.id].price)}</strong>
                  </div>
                  <div className="sheet-alts">
                    <span>بديل أقل: {sar(activeItem.cheaper[variant.id].price)}</span>
                    <span>بديل أفخم: {sar(activeItem.premium[variant.id].price)}</span>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </section>

          <section className="budget-scene full-scene" id="budget">
            <div className="budget-room" aria-hidden="true">
              <RoomVisual variant="full" />
            </div>
            <div className="budget-panel">
              <p className="eyebrow">ميزانيتك جزء من التصميم</p>
              <h2>التصميم الجميل<br />يجب أن يحترم ميزانيتك</h2>
              <strong className="budget-total">{sar(variantTotal(variant.id))}</strong>
              <div className="budget-switcher">
                {VARIANTS.map((v, index) => (
                  <button
                    key={v.id}
                    className={budgetIndex === index ? "active" : ""}
                    onClick={() => setBudgetIndex(index)}
                    type="button"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="budget-breakdown">
                {NAJRES_ROOMS.map((r) => (
                  <div key={r.key} className="budget-room-row">
                    <span>{r.name}</span>
                    <span>{sar(roomCost(r.cost, variant.id))}</span>
                  </div>
                ))}
              </div>
              <p className="data-note">الأرقام مبنية على بيانات فيلا النرجس المرجعية — لا أسعار وهمية.</p>
            </div>
          </section>

          <section className="compare-scene full-scene">
            <div className="compare-copy">
              <p className="eyebrow">قبل وبعد</p>
              <h2>لا تتخيل النتيجة.<br />شاهدها.</h2>
            </div>
            <div className="compare-frame">
              <RoomVisual variant="full" className="compare-after" />
              <div className="compare-before" style={{ clipPath: `inset(0 calc(100% - ${compare}%) 0 0)` }}>
                <RoomVisual variant="empty" />
              </div>
              <span className="compare-line" style={{ left: `${compare}%` }} />
              <input
                aria-label="مقارنة قبل وبعد"
                type="range"
                min="8"
                max="92"
                value={compare}
                onChange={(event) => setCompare(Number(event.target.value))}
              />
            </div>
          </section>

          <section className="process-scene">
            <div className="process-visual">
              <RoomVisual variant="full" />
            </div>
            <div className="process-list">
              {processSteps.map(([number, title, description]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="final-scene full-scene">
            <div>
              <p className="eyebrow">ابدأ من حيث أنت</p>
              <h2>منزلك القادم<br />يبدأ من مخططك اليوم</h2>
              <Link href="/login" className="primary-action final-action">ابدأ تصميم منزلك</Link>
              <p className="final-note">نسخة تجريبية مبكرة — صُممت وطُورت في السعودية</p>
            </div>
          </section>
        </main>

        <footer className="cinematic-footer">
          <span>© بيتي AI</span>
          <span>تصميم سعودي، برؤية مستقبلية.</span>
        </footer>
      </div>
    </>
  );
}
