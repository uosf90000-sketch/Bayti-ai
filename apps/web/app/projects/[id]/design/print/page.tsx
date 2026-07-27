"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { pipelineStore } from "@/lib/design/pipeline";
import type { ProjectPipeline } from "@/lib/design/types";
import { computeProjectCost } from "@/lib/design/costEngine";
import { sar } from "@/lib/mock";

/**
 * تقرير قابل للطباعة/حفظ كـ PDF عبر window.print() — العربية تُرسم بمحرك
 * المتصفح نفسه (لا مكتبة PDF بخطوط لاتينية تكسر التشكيل العربي). هذا هو
 * "Export: PDF" الفعلي المطلوب.
 */
export default function DesignPrint({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pipeline, setPipeline] = useState<ProjectPipeline | undefined>(undefined);

  useEffect(() => { setPipeline(pipelineStore.get(id)); }, [id]);

  if (!pipeline) {
    return (
      <main style={{ padding: 24 }}>
        <p>لا يوجد تصميم محسوب لهذا المشروع بعد.</p>
        <Link href={`/projects/${id}/design`}>العودة لشاشة التصميم</Link>
      </main>
    );
  }

  const cost = computeProjectCost(pipeline);

  return (
    <main dir="rtl" style={{ maxWidth: 820, margin: "0 auto", padding: 28, fontFamily: "system-ui, sans-serif", color: "#1a1a1a" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .room-block { break-inside: avoid; page-break-inside: avoid; }
        }
        .swatch { display:inline-block; width:16px; height:16px; border-radius:4px; margin-inline-end:6px; vertical-align:middle; }
        table { width:100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 13px; text-align: start; }
        th { background: #f3ece0; }
        h1 { font-size: 24px; } h2 { font-size: 18px; margin-top: 26px; }
      `}</style>

      <div className="no-print" style={{ marginBottom: 16 }}>
        <button onClick={() => window.print()} style={{ padding: "10px 18px", fontSize: 15, cursor: "pointer" }}>
          🖨️ اطبع / احفظ كـ PDF
        </button>
        {" "}
        <Link href={`/projects/${id}/design`}>← رجوع</Link>
      </div>

      <h1>تقرير تصميم بيتي AI</h1>
      <p>تاريخ التوليد: {new Date(pipeline.generated_at).toLocaleDateString("ar-SA")}</p>
      <p>عدد الغرف المكتشفة فعليًا: {pipeline.rooms.length} · التكلفة التقديرية للعناصر المطابقة: {sar(cost.total)} · عناصر غير مسعّرة: {cost.unpricedItemCount}</p>

      {pipeline.rooms.map((r) => (
        <div key={r.room.id} className="room-block" style={{ marginTop: 24, borderTop: "2px solid #c2a45e", paddingTop: 10 }}>
          <h2>{r.room.name_ar} {r.design ? `— ${r.design.style_ar}` : ""}</h2>
          {r.error && <p style={{ color: "#b3413a" }}>⚠ تعذّر توليد تصميم لهذه الغرفة: {r.error}</p>}
          {r.design && (
            <>
              <p>{r.design.summary_ar}</p>
              <p>
                لوحة الألوان:{" "}
                {r.design.palette.map((p) => (
                  <span key={p.hex} style={{ marginInlineEnd: 10 }}>
                    <span className="swatch" style={{ background: p.hex }} />
                    {p.name_ar}
                  </span>
                ))}
              </p>
              <table>
                <thead><tr><th>العنصر</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>المنتج/السعر</th></tr></thead>
                <tbody>
                  {r.shopping.map((m, i) => {
                    const qty = "qty" in m.item ? m.item.qty : 1;
                    const category = "category" in m.item ? m.item.category : m.item.category_ar;
                    return (
                      <tr key={i}>
                        <td>{m.item.name_ar}</td>
                        <td>{category}</td>
                        <td>{qty}</td>
                        <td>{m.matched ? "متوفر بالكتالوج" : "لا يوجد منتج مطابق"}</td>
                        <td>{m.matched ? `${m.productName} — ${m.price != null ? sar(m.price) : "سعر غير مؤكد"}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      ))}

      <p style={{ marginTop: 30, fontSize: 12, color: "#666" }}>
        التكاليف أعلاه محسوبة فقط من عناصر مطابقة فعليًا بمنتجات حقيقية من الكتالوج المعتمد — العناصر بلا مطابقة لا تُحتسب ولا تُقدَّر بسعر مُخترع.
      </p>
    </main>
  );
}
