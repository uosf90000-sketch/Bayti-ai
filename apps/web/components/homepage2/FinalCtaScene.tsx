import Link from "next/link";

export function FinalCtaScene() {
  return (
    <section id="pricing" className="hp2-scene" style={{ minHeight: "90svh" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner">
        <h2 className="hp2-display">
          <span className="line">منزلك القادم</span>
          <span className="line gold">يبدأ من مخططك اليوم</span>
        </h2>
        <div className="hp2-actions" style={{ marginTop: 34 }}>
          <Link href="/login" className="hp2-btn hp2-btn-solid">ابدأ تصميم منزلك</Link>
        </div>
        <p className="dim t-sm" style={{ marginTop: 18 }}>نسخة تجريبية مبكرة — صُممت وطُورت في السعودية</p>
      </div>
    </section>
  );
}
