"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGENTS } from "@/lib/mock";

const steps = [
  ["01", "ارفع مخططك", "PDF أو صورة واضحة، وبيتي يبدأ بفهم الغرف والفتحات والحركة."],
  ["02", "اختر أسلوبك", "حدّد الأجواء التي تحبها، ثم عدّلها لكل غرفة عند الحاجة."],
  ["03", "شاهد التصميم", "استكشف المنزل بصريًا واعرف سبب كل قرار قبل اعتماده."],
  ["04", "بدّل وعدّل", "غيّر القطع والخامات والميزانية دون فقدان منطق التصميم."],
];

const budgetModes = [
  { id: "economy", label: "اقتصادي", title: "الأولوية للذكاء في الاختيار", desc: "حلول عملية وخامات هادئة مع الحفاظ على التناسق." },
  { id: "balanced", label: "متوازن", title: "أفضل نقطة بين الجمال والقيمة", desc: "تفاصيل محسوبة وقطع مختارة لتجربة يومية راقية." },
  { id: "luxury", label: "فاخر", title: "تفاصيل أعمق وخامات أرقى", desc: "مساحة أكثر تفرّدًا مع خيارات تصميم مميزة." },
] as const;

type BudgetMode = (typeof budgetModes)[number]["id"];

export function BaytiHome() {
  const root = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [budget, setBudget] = useState<BudgetMode>("balanced");
  const [compare, setCompare] = useState(52);

  useEffect(() => {
    if (!root.current) return;
    let disposed = false;
    let stop = () => undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]).then(
      ([gsapModule, triggerModule, lenisModule]) => {
        if (disposed || !root.current) return;
        const gsap = gsapModule.gsap;
        const ScrollTrigger = triggerModule.ScrollTrigger;
        const Lenis = lenisModule.default;
        gsap.registerPlugin(ScrollTrigger);

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const lenis = reduced ? null : new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9 });
        let rafId = 0;
        if (lenis) {
          lenis.on("scroll", ScrollTrigger.update);
          const raf = (time: number) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
          rafId = requestAnimationFrame(raf);
        }

        const ctx = gsap.context(() => {
          if (reduced) return;
          gsap.from(".bv3-hero-copy > *", { y: 38, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out" });
          gsap.to(".bv3-hero-photo img", { scale: 1.1, yPercent: 5, ease: "none", scrollTrigger: { trigger: ".bv3-hero", start: "top top", end: "bottom top", scrub: true } });
          gsap.to(".bv3-hero-copy", { opacity: 0, yPercent: -18, ease: "none", scrollTrigger: { trigger: ".bv3-hero", start: "35% top", end: "bottom top", scrub: true } });

          const plan = gsap.timeline({ scrollTrigger: { trigger: ".bv3-plan", start: "top top", end: "+=180%", scrub: 1, pin: true } });
          plan.fromTo(".bv3-plan-blueprint", { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 1 })
            .to(".bv3-plan-blueprint", { opacity: 0, scale: 1.08, duration: 0.8 }, 1)
            .fromTo(".bv3-plan-model", { opacity: 0, scale: 0.88, rotateX: 8 }, { opacity: 1, scale: 1, rotateX: 0, duration: 1 }, 1.1)
            .fromTo(".bv3-plan-copy", { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.7 }, 1.35);

          gsap.utils.toArray<HTMLElement>(".bv3-reveal").forEach((el) => {
            gsap.from(el, { opacity: 0, y: 42, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 82%" } });
          });

          gsap.utils.toArray<HTMLElement>(".bv3-expert").forEach((el, index) => {
            gsap.from(el, { opacity: 0.12, x: index % 2 ? -28 : 28, scrollTrigger: { trigger: el, start: "top 82%", end: "top 48%", scrub: true } });
          });

          gsap.fromTo(".bv3-build-after", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: "none", scrollTrigger: { trigger: ".bv3-build", start: "top top", end: "+=170%", scrub: true, pin: true } });
          ScrollTrigger.refresh();
        }, root);

        stop = () => { ctx.revert(); cancelAnimationFrame(rafId); lenis?.destroy(); };
      }
    );

    return () => { disposed = true; stop(); };
  }, []);

  const currentBudget = budgetModes.find((item) => item.id === budget) ?? budgetModes[1];

  return (
    <div ref={root} className="bv3" dir="rtl">
      <header className="bv3-nav">
        <Link href="/" className="bv3-brand" aria-label="بيتي الرئيسية"><span>بيتي</span><small>Bayti</small></Link>
        <nav aria-label="التنقل الرئيسي">
          <a href="#story">كيف يعمل</a><a href="#council">مجلس بيتي</a><a href="#products">المنتجات</a><a href="#budget">الميزانية</a>
        </nav>
        <div className="bv3-nav-actions"><Link href="/login" className="bv3-login">دخول</Link><Link href="/login" className="bv3-start">ابدأ تصميمك</Link></div>
        <button className="bv3-menu-button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><span/><span/></button>
      </header>

      <AnimatePresence>
        {menuOpen && <motion.div className="bv3-mobile-menu" initial={{ opacity: 0, clipPath: "circle(0% at 90% 7%)" }} animate={{ opacity: 1, clipPath: "circle(150% at 90% 7%)" }} exit={{ opacity: 0 }} transition={{ duration: .55 }}>
          <button onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة">×</button>
          <a href="#story" onClick={() => setMenuOpen(false)}>كيف يعمل</a><a href="#council" onClick={() => setMenuOpen(false)}>مجلس بيتي</a><a href="#products" onClick={() => setMenuOpen(false)}>المنتجات</a><a href="#budget" onClick={() => setMenuOpen(false)}>الميزانية</a><Link href="/login">ابدأ تصميمك</Link>
        </motion.div>}
      </AnimatePresence>

      <main>
        <section className="bv3-hero">
          <div className="bv3-hero-photo"><Image src="/bayti-home/hero-room.webp" alt="غرفة معيشة دافئة بتصميم داخلي معاصر" fill priority sizes="100vw" /></div>
          <div className="bv3-hero-wash" />
          <div className="bv3-hero-copy">
            <p className="bv3-kicker">التصميم الداخلي بالذكاء الاصطناعي</p>
            <h1>من مخططك<br/>إلى منزل <em>ينبض بالحياة</em></h1>
            <p>نحوّل مخططك إلى تجربة تصميم متكاملة، ونربط كل قرار بمساحتك وأسلوبك وميزانيتك.</p>
            <div className="bv3-actions"><Link href="/login" className="bv3-primary">ابدأ تصميم منزلك</Link><a href="#story" className="bv3-secondary">شاهد كيف يعمل</a></div>
          </div>
          <a className="bv3-scroll" href="#story"><span/>اكتشف التجربة</a>
        </section>

        <section className="bv3-intro" id="story">
          <div className="bv3-intro-number">01</div>
          <div className="bv3-intro-copy bv3-reveal"><p className="bv3-kicker">من الفكرة إلى الواقع</p><h2>نبدأ بفهم مساحتك،<br/>لا بتزيين صورة.</h2><p>نقرأ المخطط، نكتشف العلاقات بين الغرف، ثم نبني قرارًا يمكن شرحه وتعديله وتنفيذه.</p></div>
          <div className="bv3-intro-note">كل خط في المخطط يصبح قرارًا في التصميم.</div>
        </section>

        <section className="bv3-plan">
          <div className="bv3-plan-stage">
            <Image className="bv3-plan-blueprint" src="/bayti-home/blueprint.svg" alt="مخطط معماري" fill sizes="90vw" />
            <Image className="bv3-plan-model" src="/bayti-home/room-model.webp" alt="نموذج بصري للمنزل" fill sizes="90vw" />
          </div>
          <div className="bv3-plan-copy"><span>02</span><h2>المخطط يتحوّل<br/>إلى مساحة مفهومة</h2><p>غرف، أبواب، نوافذ، حركة، وإضاءة — كلها تتصل داخل نموذج واحد.</p><Link href="/login">ارفع مخططك الآن</Link></div>
        </section>

        <section className="bv3-council" id="council">
          <div className="bv3-section-head bv3-reveal"><p className="bv3-kicker">مجلس بيتي</p><h2>13 خبيرًا.<br/><em>رؤية واحدة لمنزلك.</em></h2><p>كل تخصص يرى جانبًا مختلفًا، ثم تُجمع القرارات في تصميم واحد متوازن.</p></div>
          <div className="bv3-experts">{AGENTS.map((agent, index) => <article className="bv3-expert" key={agent.id}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{agent.name}</h3><p>{agent.specialty}</p></div></article>)}</div>
        </section>

        <section className="bv3-build">
          <div className="bv3-build-media"><Image src="/bayti-home/before-room.webp" alt="الغرفة قبل التصميم" fill sizes="100vw"/><div className="bv3-build-after"><Image src="/bayti-home/after-room.webp" alt="الغرفة بعد التصميم" fill sizes="100vw"/></div></div>
          <div className="bv3-build-copy"><span>03</span><h2>نصمم المساحة<br/>طبقة بعد طبقة</h2><p>توزيع الحركة، الخامات، الإضاءة، الأثاث، ثم التفاصيل التي تجعل المكان يشبهك.</p></div>
        </section>

        <section className="bv3-products" id="products">
          <div className="bv3-product-visual"><Image src="/bayti-home/style-room.webp" alt="غرفة مع مجموعة خامات وقطع أثاث" fill sizes="60vw"/><button className="bv3-pin bv3-pin-a" aria-label="نقطة منتج"><i/></button><button className="bv3-pin bv3-pin-b" aria-label="نقطة منتج"><i/></button><button className="bv3-pin bv3-pin-c" aria-label="نقطة منتج"><i/></button></div>
          <div className="bv3-product-copy bv3-reveal"><p className="bv3-kicker">منتجات قابلة للشراء</p><h2>كل قطعة تراها،<br/>تعرف لماذا اخترناها.</h2><p>القطعة، المقاس، المتجر، والبدائل تظهر من مكتبة المنتجات داخل النظام — بدون أسعار أو روابط مختلقة.</p><div className="bv3-product-lines"><span>الأثاث</span><span>الإضاءة</span><span>الخامات</span><span>الإكسسوارات</span></div></div>
        </section>

        <section className="bv3-budget" id="budget" data-budget={budget}>
          <div className="bv3-budget-copy"><p className="bv3-kicker">ميزانيتك جزء من التصميم</p><h2>اختر المستوى،<br/>وشاهد الفرق بصريًا.</h2><div className="bv3-budget-tabs">{budgetModes.map((item)=><button key={item.id} data-active={budget===item.id} onClick={()=>setBudget(item.id)}>{item.label}</button>)}</div><motion.div key={currentBudget.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><h3>{currentBudget.title}</h3><p>{currentBudget.desc}</p></motion.div></div>
          <div className="bv3-budget-visual"><Image src="/bayti-home/hero-room.webp" alt="تغير بصري حسب مستوى الميزانية" fill sizes="55vw"/><span className="bv3-budget-label">{currentBudget.label}</span></div>
        </section>

        <section className="bv3-compare">
          <div className="bv3-section-head bv3-reveal"><p className="bv3-kicker">قبل وبعد</p><h2>لا تتخيل النتيجة.<br/><em>شاهدها.</em></h2></div>
          <div className="bv3-compare-frame"><Image src="/bayti-home/after-room.webp" alt="بعد التصميم" fill sizes="92vw"/><div className="bv3-compare-before" style={{width:`${compare}%`}}><Image src="/bayti-home/before-room.webp" alt="قبل التصميم" fill sizes="92vw"/></div><span className="bv3-compare-line" style={{right:`${compare}%`}}/><input type="range" min="8" max="92" value={compare} onChange={(e)=>setCompare(Number(e.target.value))} aria-label="مقارنة قبل وبعد"/></div>
        </section>

        <section className="bv3-how">
          <div className="bv3-how-visual"><Image src="/bayti-home/floorplan.webp" alt="مخطط منزل" fill sizes="45vw"/></div>
          <div className="bv3-how-list">{steps.map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div>
        </section>

        <section className="bv3-final"><p className="bv3-kicker">ابدأ من مخططك الحالي</p><h2>منزلك القادم<br/>يبدأ اليوم.</h2><Link href="/login" className="bv3-primary">ابدأ تصميم منزلك</Link><small>نسخة تجريبية مبكرة — صُممت وطُورت في السعودية</small></section>
      </main>
      <footer className="bv3-footer"><strong>بيتي · Bayti</strong><span>تصميم داخلي مدعوم بالذكاء الاصطناعي</span></footer>
    </div>
  );
}
