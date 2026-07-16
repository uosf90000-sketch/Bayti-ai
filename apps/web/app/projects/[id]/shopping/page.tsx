"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth } from "@/components/ui";
import { VariantSwitcher, useCountUp } from "@/components/variant";
import { sar } from "@/lib/mock";
import { catalog } from "@/lib/services";
import type { CanonicalProduct, MerchantOffer } from "@/lib/catalog/types";
import {
  SHOP_ITEMS, choicesStore, offerFor, savings, variantTotal,
  type VariantId, type Choice,
} from "@/lib/shop";

type ShoppableProduct = CanonicalProduct & { bestOffer: MerchantOffer | null };

/* شريحة التسوق — W4 (تبديل النسخ) + W6 (عدّاد التوفير) + استبدال القطع (P4)
   المتاجر معلَّمة "تجريبي" بوضوح (قرار مؤسس): لا روابط تدّعي أنها حقيقية. */

export default function Shopping({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variant, setVariant] = useState<VariantId>("balanced");
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [catalogProducts, setCatalogProducts] = useState<ShoppableProduct[] | null>(null);

  useEffect(() => { setChoices(choicesStore.get(id, variant)); }, [id, variant]);
  useEffect(() => { catalog.listShoppable().then(setCatalogProducts); }, []);

  const pick = (itemId: string, c: Choice) => {
    const next = { ...choices, [itemId]: c };
    setChoices(next);
    choicesStore.set(id, variant, next);
  };

  const saved = useMemo(() => savings(variant, choices), [variant, choices]);
  const total = useMemo(() => {
    const swapDelta = SHOP_ITEMS.reduce((s, it) => {
      const c = choices[it.id] ?? "primary";
      return s + (offerFor(it, variant, c).price - it.offers[variant].price) * it.qty;
    }, 0);
    return variantTotal(variant) + swapDelta;
  }, [variant, choices]);

  const animatedTotal = useCountUp(total);
  const animatedSaved = useCountUp(saved);

  return (
    <RequireAuth>
      <main>
        <TopBar backHref={`/projects/${id}/preview`} />
        <section className="shell" style={{ paddingTop: 20, paddingBottom: 56, maxWidth: 760 }}>
          <h1 className="h-xl">قائمة التسوق</h1>
          <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>
            كل قطعة فُحصت هندسيًا — البدائل بنفس المقاس. غيّر النسخة أو استبدل أي قطعة وشاهد الأثر فورًا.
          </p>

          <VariantSwitcher value={variant} onChange={setVariant} />

          {/* الشريط الحي: الإجمالي + التوفير (W6) */}
          <div className="glass" style={{
            position: "sticky", top: 68, zIndex: 30, marginTop: 12, padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
          }}>
            <div>
              <div className="dim" style={{ fontSize: 12 }}>إجمالي المشروع</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 800, color: "var(--gold-300)" }}>
                {sar(animatedTotal)}
              </div>
            </div>
            <div style={{ textAlign: "start" }}>
              <div className="dim" style={{ fontSize: 12 }}>وفّرت باختياراتك</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 800, color: "var(--savings)" }}>
                {saved > 0 ? `↓ ${sar(animatedSaved)}` : "—"}
              </div>
            </div>
          </div>

          {/* العناصر */}
          <div className="stack" style={{ marginTop: 16 }}>
            {SHOP_ITEMS.map((it) => {
              const c = choices[it.id] ?? "primary";
              const current = offerFor(it, variant, c);
              const base = it.offers[variant];
              const cheaperDelta = (base.price - it.cheaper[variant].price) * it.qty;
              const premiumDelta = (it.premium[variant].price - base.price) * it.qty;
              return (
                <div key={it.id} className="glass" style={{ padding: 16 }}>
                  <div className="row" style={{ alignItems: "flex-start" }}>
                    <span className="agent-avatar" style={{ fontSize: 22 }}>{it.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 15.5 }}>{it.title}</span>
                        <span className="chip">{it.roomName}</span>
                      </div>
                      <p className="dim" style={{ fontSize: 12.5, marginTop: 2 }}>{it.spec}</p>

                      {/* المنتج الحالي */}
                      <div className="row" style={{ marginTop: 10, justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{current.name}</div>
                          <div className="row" style={{ gap: 6, marginTop: 3 }}>
                            <span className="chip" style={{ fontSize: 11.5 }}>🏪 {current.store}</span>
                            <span className="chip chip-gold" style={{ fontSize: 11.5 }}>رابط تجريبي — الكتالوج الحقيقي قريبًا</span>
                          </div>
                        </div>
                        <div className="num" style={{ fontSize: 19, fontWeight: 800, color: "var(--gold-300)", whiteSpace: "nowrap" }}>
                          {sar(current.price * it.qty)}
                          {it.qty > 1 && <span className="dim" style={{ fontSize: 11, fontWeight: 400 }}> ×{it.qty}</span>}
                        </div>
                      </div>

                      {/* الاستبدال (P4): بديل أرخص / الأساسي / بديل أفخم */}
                      <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
                        <SwapChip
                          active={c === "cheaper"} onClick={() => pick(it.id, "cheaper")}
                          label={`بديل أرخص  ↓ ${sar(cheaperDelta)}`} tone="save" title={it.cheaper[variant].name}
                        />
                        <SwapChip
                          active={c === "primary"} onClick={() => pick(it.id, "primary")}
                          label="اختيار المجلس ✓" tone="base" title={base.name}
                        />
                        <SwapChip
                          active={c === "premium"} onClick={() => pick(it.id, "premium")}
                          label={`بديل أفخم  ↑ ${sar(premiumDelta)}`} tone="up" title={it.premium[variant].name}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass" style={{ padding: 16, marginTop: 16, textAlign: "center" }}>
            <p className="dim" style={{ fontSize: 13 }}>
              🏪 المنتجات والمتاجر أعلاه <b>تجريبية للعرض</b> — الأسعار والروابط الحقيقية من المتاجر السعودية
              تصل مع ربط منصة التجارة (القسم 7). باقي بنود المشروع (تشطيبات، إنارة، كهرباء) تُعرض تفصيلًا حينها.
            </p>
            <Link href={`/projects/${id}/preview`} className="btn btn-ghost" style={{ marginTop: 10 }}>
              عودة للمعاينة
            </Link>
          </div>

          {/* الكتالوج الحقيقي (Bayti Catalog Builder) — منتجات حقيقية اجتازت حد الجودة فقط، منفصلة عن إجمالي المشروع أعلاه */}
          <div style={{ marginTop: 28 }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <h2 className="h-lg">الكتالوج الحقيقي</h2>
              <span className="chip chip-success">منتجات حقيقية بروابط شراء رسمية</span>
            </div>
            <p className="muted t-sm" style={{ marginBottom: 14 }}>
              من متاجر سعودية حقيقية — تُعرض فقط المنتجات التي اجتازت حد الجودة (سعر وحالة توفر موثّقان). لا تُحتسب هذه القائمة ضمن إجمالي المشروع أعلاه بعد.
            </p>
            {catalogProducts === null ? (
              <div className="grid-cards">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
              </div>
            ) : catalogProducts.length === 0 ? (
              <div className="card" style={{ padding: 20, textAlign: "center" }}>
                <p className="muted t-sm">لا منتجات اجتازت حد الجودة بعد — قيد التحقق من الأسعار والمقاسات.</p>
              </div>
            ) : (
              <div className="grid-cards">
                {catalogProducts.map((p) => {
                  const offer = p.bestOffer!;
                  const name = p.canonicalNameAr || p.canonicalNameEn || "منتج";
                  return (
                    <div key={p.id} className="card card-hover" style={{ padding: 16 }}>
                      <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                        <span className="chip">{p.category}</span>
                        <span className="chip chip-gold t-sm">جودة {p.qualityScore}</span>
                      </div>
                      <h3 className="h-md" style={{ marginTop: 10 }}>{name}</h3>
                      <p className="dim t-sm" style={{ marginTop: 2 }}>{offer.merchantName}</p>
                      <div className="row" style={{ justifyContent: "space-between", marginTop: 12, alignItems: "center" }}>
                        <span className="num gold" style={{ fontSize: 19, fontWeight: 800 }}>
                          {offer.price != null ? sar(offer.price) : "السعر غير مؤكد"}
                        </span>
                        {offer.productUrl && (
                          <a href={offer.productUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ minHeight: 38, padding: "0 14px", fontSize: 13 }}>
                            صفحة المنتج ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

function SwapChip({ active, onClick, label, title, tone }: {
  active: boolean; onClick: () => void; label: string; title: string; tone: "save" | "base" | "up";
}) {
  const color = tone === "save" ? "var(--savings)" : tone === "up" ? "var(--gold-300)" : "var(--sand-50)";
  return (
    <button
      onClick={onClick} title={title}
      className="btn" style={{
        minHeight: 40, padding: "0 14px", fontSize: 12.5, fontWeight: 700,
        background: active ? "rgba(194,164,94,0.16)" : "var(--glass-light)",
        border: `1.5px solid ${active ? "var(--gold-500)" : "var(--glass-border)"}`,
        color,
      }}
    >
      {label}
    </button>
  );
}
