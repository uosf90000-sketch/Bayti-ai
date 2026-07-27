"use client";
import { useState } from "react";
import { SHOP_ITEMS, offerFor, type ShopItem } from "@/lib/shop";
import { sar } from "@/lib/mock";

/**
 * غرفة مكتملة ملء الشاشة بنقاط منتجات حقيقية. تستخدم بيانات SHOP_ITEMS المعلنة
 * "تجريبية" صراحة في مصدرها (نفس بيانات مشروع "فيلا النرجس" المرجعي) — مناسبة
 * تحديدًا للواجهة التسويقية العامة (لا مشروع مستخدم حقيقي هنا بعد تسجيل الدخول).
 */
const HOTSPOTS: { itemId: string; x: number; y: number }[] = [
  { itemId: "sofa_majlis", x: 25, y: 68 },
  { itemId: "chandelier", x: 25, y: 10 },
];

export function ProductsScene() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = SHOP_ITEMS.find((i) => i.id === openId);

  return (
    <section className="hp2-scene" style={{ minHeight: "100svh" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner">
        <h2 className="hp2-display" style={{ fontSize: "clamp(28px, 5vw, 54px)" }}>
          <span className="line">كل قطعة تراها</span>
          <span className="line gold">تعرف من أين تشتريها</span>
        </h2>
        <p className="hp2-sub">لا صور خيالية ولا مقاسات مجهولة. كل اقتراح مرتبط بمنتج حقيقي ومقاس وسعر متاح.</p>

        <div className="hp2-room-visual" style={{ marginTop: 30 }}>
          <svg viewBox="0 0 800 500" fill="none">
            <rect x="0" y="0" width="800" height="380" fill="var(--surface)" />
            <rect x="0" y="380" width="800" height="120" fill="var(--surface-2)" />
            <rect x="580" y="60" width="160" height="220" rx="6" fill="color-mix(in srgb, var(--accent) 18%, var(--bg-2))" stroke="var(--line-strong)" strokeWidth="2" />
            <circle cx="660" cy="170" r="120" fill="var(--accent)" opacity="0.14" />
            <circle cx="200" cy="40" r="10" fill="var(--accent)" />
            <line x1="200" y1="0" x2="200" y2="30" stroke="var(--line-strong)" strokeWidth="2" />
            <rect x="60" y="290" width="280" height="90" rx="18" fill="var(--accent-deep)" />
            <rect x="60" y="270" width="280" height="30" rx="14" fill="var(--accent-deep)" />
            <ellipse cx="440" cy="400" rx="90" ry="16" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="1.5" />
          </svg>

          {HOTSPOTS.map((h) => (
            <button
              key={h.itemId} type="button" className="hp2-hotspot"
              style={{ insetInlineStart: `${h.x}%`, top: `${h.y}%` }}
              aria-label={SHOP_ITEMS.find((i) => i.id === h.itemId)?.title}
              onClick={() => setOpenId((v) => (v === h.itemId ? null : h.itemId))}
            >
              <span className="dot" />
            </button>
          ))}
        </div>
      </div>

      {open && <ProductSheet item={open} onClose={() => setOpenId(null)} />}
    </section>
  );
}

function ProductSheet({ item, onClose }: { item: ShopItem; onClose: () => void }) {
  const current = offerFor(item, "balanced", "primary");
  const cheaper = offerFor(item, "balanced", "cheaper");
  const premium = offerFor(item, "balanced", "premium");
  return (
    <div className="hp2-product-sheet anim-fade-up">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 className="h-lg">{item.title}</h3>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="btn btn-ghost" style={{ minHeight: 32, minWidth: 32, padding: 0, borderRadius: 999 }}>✕</button>
      </div>
      <p className="dim t-sm" style={{ marginTop: 4 }}>{item.spec}</p>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{current.name}</div>
          <div className="dim t-sm">🏪 {current.store}</div>
        </div>
        <div className="num gold" style={{ fontSize: 20, fontWeight: 800 }}>{sar(current.price)}</div>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <span className="chip">↓ اقتصادي: {sar(cheaper.price)}</span>
        <span className="chip chip-gold">↑ فاخر: {sar(premium.price)}</span>
      </div>
    </div>
  );
}
