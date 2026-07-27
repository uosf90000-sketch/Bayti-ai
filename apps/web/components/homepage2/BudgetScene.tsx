"use client";
import { useMemo, useState } from "react";
import { useCountUp } from "@/components/variant";
import { SHOP_ITEMS, variantTotal, type VariantId } from "@/lib/shop";
import { sar } from "@/lib/mock";

const VARIANTS: { id: VariantId; label: string }[] = [
  { id: "economy", label: "اقتصادي" }, { id: "balanced", label: "متوازن" }, { id: "luxury", label: "فاخر" },
];

/** فئتان حقيقيتان فقط مدعومتان ببيانات SHOP_ITEMS فعلية (أثاث/إضاءة) — لا نُظهر فئات بأرقام غير موجودة */
function breakdown(v: VariantId) {
  let furniture = 0, lighting = 0;
  for (const it of SHOP_ITEMS) {
    const price = it.offers[v].price * it.qty;
    if (it.id === "chandelier") lighting += price; else furniture += price;
  }
  return { furniture, lighting };
}

export function BudgetScene() {
  const [variant, setVariant] = useState<VariantId>("balanced");
  const total = variantTotal(variant);
  const animated = useCountUp(total);
  const { furniture, lighting } = useMemo(() => breakdown(variant), [variant]);

  return (
    <section className="hp2-scene" style={{ minHeight: "100svh" }}>
      <div className="hp2-scene-bg"><div className="hp2-atmosphere" /></div>
      <div className="hp2-scene-inner">
        <h2 className="hp2-display" style={{ fontSize: "clamp(28px, 5vw, 50px)" }}>
          <span className="line">التصميم الجميل</span>
          <span className="line gold">يجب أن يحترم ميزانيتك</span>
        </h2>

        <div className="hp2-budget-slider" role="tablist" aria-label="نسخة التصميم">
          {VARIANTS.map((v) => (
            <button key={v.id} type="button" data-active={variant === v.id} onClick={() => setVariant(v.id)}>{v.label}</button>
          ))}
        </div>

        <div className="hp2-budget-total num gold">{sar(animated)}</div>

        <div className="hp2-budget-breakdown">
          <div className="hp2-budget-item">
            <div className="label">الأثاث</div>
            <div className="value num">{sar(furniture)}</div>
          </div>
          <div className="hp2-budget-item">
            <div className="label">الإضاءة</div>
            <div className="value num">{sar(lighting)}</div>
          </div>
          <div className="hp2-budget-item">
            <div className="label">عناصر بارزة</div>
            <div className="value num">{SHOP_ITEMS.length}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
