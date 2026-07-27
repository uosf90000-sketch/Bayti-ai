"use client";
import { useCountUp } from "@/components/variant";
import type { ProjectCost } from "@/lib/design/types";
import { sar } from "@/lib/mock";

/** الميزانية كلحظة سردية — رقم كبير يتحرك + تفكيك بصري بالقسم، لا جدول ثابت */
export function BudgetReveal({ cost, onClose }: { cost: ProjectCost; onClose: () => void }) {
  const total = useCountUp(cost.total, 700);
  const categories = Object.entries(cost.byCategory).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...categories.map(([, v]) => v));

  return (
    <div className="glass anim-fade-up" style={{ position: "absolute", inset: "84px 16px 16px", zIndex: 5, padding: 24, overflowY: "auto", maxWidth: 520, marginInline: "auto" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className="chip chip-gold">ميزانيتك تتحرك معك</span>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="btn btn-ghost" style={{ minHeight: 34, minWidth: 34, padding: 0, borderRadius: 999 }}>✕</button>
      </div>

      <div style={{ textAlign: "center", margin: "22px 0" }}>
        <div className="num text-gradient" style={{ fontSize: "clamp(38px, 8vw, 64px)", fontWeight: 800, lineHeight: 1 }}>{sar(total)}</div>
        <p className="dim t-sm" style={{ marginTop: 8 }}>
          {cost.unpricedItemCount > 0 ? `${cost.unpricedItemCount} عنصرًا بلا منتج مطابق بعد — غير محتسبة` : "كل عنصر هنا له منتج حقيقي وسعر مؤكد"}
        </p>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {categories.map(([cat, amount]) => (
          <div key={cat}>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span>{cat}</span>
              <span className="num gold">{sar(amount)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.round((amount / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="dim t-sm" style={{ textAlign: "center" }}>لا تكلفة محتسبة بعد — صمّم غرفة واحدة على الأقل أولًا</p>}
      </div>
    </div>
  );
}
