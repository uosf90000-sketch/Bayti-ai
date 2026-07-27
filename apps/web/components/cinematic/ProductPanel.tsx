"use client";
import type { ShoppingMatch } from "@/lib/design/types";
import { sar } from "@/lib/mock";

/** بطاقة جانبية ناعمة لعنصر أثاث نُقر عليه داخل المشهد — بيانات حقيقية فقط، لا بدائل مُخترعة (P9) */
export function ProductPanel({ match, onClose }: { match: ShoppingMatch; onClose: () => void }) {
  const name = "name_ar" in match.item ? match.item.name_ar : "";
  const spec = "spec_ar" in match.item ? match.item.spec_ar : "description_ar" in match.item ? match.item.description_ar : "";

  return (
    <div className="glass anim-fade-up" style={{ position: "absolute", insetInlineEnd: 16, top: 84, bottom: 16, width: "min(340px, 88vw)", zIndex: 4, padding: 18, overflowY: "auto" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 className="h-lg">{name}</h3>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="btn btn-ghost" style={{ minHeight: 34, minWidth: 34, padding: 0, borderRadius: 999 }}>✕</button>
      </div>
      <p className="dim t-sm" style={{ marginTop: 4 }}>{spec}</p>

      {match.matched ? (
        <div style={{ marginTop: 16 }}>
          <div className="dim t-sm">المنتج المطابق</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginTop: 4 }}>{match.productName}</div>
          <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span className="chip">🏪 {match.merchantName}</span>
          </div>
          <div className="num gold" style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>
            {match.price != null ? sar(match.price) : "السعر غير مؤكد"}
          </div>
          {match.productUrl && (
            <a href={match.productUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-block" style={{ marginTop: 14, minHeight: 48 }}>
              صفحة المنتج ↗
            </a>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16, padding: 14 }}>
          <p className="muted t-sm">لا يوجد منتج حقيقي مطابق لهذا العنصر في الكتالوج حتى الآن — لن نعرض بديلًا غير موثّق.</p>
        </div>
      )}
    </div>
  );
}
