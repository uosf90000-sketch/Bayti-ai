"use client";
import { use, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth } from "@/components/ui";
import { VariantSwitcher, useCountUp } from "@/components/variant";
import { NAJRES_ROOMS, NAJRES_TOTALS, sar } from "@/lib/mock";
import { roomCost, variantTotal, type VariantId } from "@/lib/shop";

/* أول Preview + مبدّل النسخ الثلاث (W4) — الهندسة ثابتة والمنتجات تتبدل (§6.20).
   الصور تدرجات مؤقتة عمدًا: لا صور زائفة قبل الرندر الحقيقي (P8/§8.7) */

export default function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variant, setVariant] = useState<VariantId>("balanced");
  const t = NAJRES_TOTALS;
  const total = variantTotal(variant);
  const animated = useCountUp(total);
  const pct = Math.min(100, Math.round((total / t.budget) * 100));
  const within = total <= t.budget;

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="shell" style={{ paddingTop: 24, paddingBottom: 56 }}>
          {/* الملخص + مبدّل النسخ */}
          <div className="glass anim-fade-up" style={{ padding: "24px 22px", marginBottom: 18, background: "linear-gradient(160deg, rgba(194,164,94,0.09), var(--glass-surface))" }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 className="h-xl">بيتك جاهز 🎉</h1>
                <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>
                  {t.rooms} غرفة · {t.itemCount} عنصرًا مصممًا · صحة التصميم <b className="gold num">{t.health}/100</b>
                </p>
              </div>
              <div style={{ textAlign: "start" }}>
                <div className="dim" style={{ fontSize: 13 }}>التكلفة الإجمالية</div>
                <div className="num" style={{ fontSize: 30, fontWeight: 800, color: "var(--gold-300)" }}>{sar(animated)}</div>
                <div style={{ fontSize: 13, color: within ? "var(--savings)" : "var(--warning)" }}>
                  {within
                    ? `✓ ضمن ميزانيتك (${sar(t.budget)}) — استخدمنا ${pct}%`
                    : `⚠ تتجاوز ميزانيتك بـ ${sar(total - t.budget)} — جرّب استبدال قطع أو نسخة أوفر`}
                </div>
              </div>
            </div>
            <div className="progress-track" style={{ marginTop: 14 }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: within ? undefined : "linear-gradient(90deg, var(--warning), var(--danger))" }} />
            </div>
            <div style={{ marginTop: 16 }}>
              <VariantSwitcher value={variant} onChange={setVariant} />
            </div>
            <Link href={`/projects/${id}/shopping`} className="btn btn-gold btn-block" style={{ marginTop: 14, minHeight: 52, fontSize: 16 }}>
              🛍️ قائمة التسوق والاستبدال
            </Link>
          </div>

          {/* الغرف */}
          <h2 className="h-lg" style={{ marginBottom: 12 }}>غرفك المصممة</h2>
          <div className="grid-cards stagger">
            {NAJRES_ROOMS.map((r) => (
              <div key={r.key} className="glass glass-hover" style={{ padding: 14 }}>
                <div className="room-visual" style={{ background: r.gradient }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{r.name}</div>
                    <div className="dim" style={{ fontSize: 12.5 }}>{r.area} م² · {r.items} عنصرًا</div>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 10, minHeight: 40 }}>{r.highlight}</p>
                <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                  <span className="chip chip-gold num">{sar(roomCost(r.cost, variant))}</span>
                  <span className="dim" style={{ fontSize: 12 }}>الصور الواقعية قريبًا</span>
                </div>
              </div>
            ))}
          </div>

          {/* القادم */}
          <div className="glass" style={{ padding: "22px 20px", marginTop: 22, textAlign: "center" }}>
            <h3 className="h-lg">🚧 هذه أول نظرة فقط</h3>
            <p className="muted" style={{ maxWidth: 560, margin: "8px auto 0", fontSize: 14.5 }}>
              قادم تباعًا: الصور الواقعية لكل غرفة، التعديل بالمحادثة، تقرير PDF، والنموذج ثلاثي الأبعاد.
            </p>
            <div className="row" style={{ justifyContent: "center", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
              {["💬 عدّل بالمحادثة", "📄 تقرير PDF", "🏠 جولة 3D", "🖼️ صور واقعية"].map((x) => (
                <span key={x} className="chip">{x}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
