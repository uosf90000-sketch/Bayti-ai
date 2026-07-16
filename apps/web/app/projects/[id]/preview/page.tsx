"use client";
import { use, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth } from "@/components/ui";
import { VariantSwitcher, useCountUp } from "@/components/variant";
import { RoomScene, type RoomKind } from "@/components/scene";
import { NAJRES_ROOMS, NAJRES_TOTALS, sar } from "@/lib/mock";
import { roomCost, variantTotal, type VariantId } from "@/lib/shop";

/* أول Preview + مبدّل النسخ الثلاث (W4) — الهندسة ثابتة والمنتجات تتبدل (§6.20).
   المشاهد الداخلية رسم SVG من التوأم الرقمي — لا صور فوتوغرافية زائفة قبل الرندر الحقيقي (P8/§8.7) */

const DESIGNER_NOTE =
  "روح هذا التصميم مبنية على التوازن: مجلس New Classic بلمسات ذهبية للضيافة، ومعيشة عائلية Modern دافئة للحياة اليومية. " +
  "وزّعنا 46 نقطة إضاءة على 3 طبقات محسوبة لتُظهر كل زاوية بأفضل حالاتها ليلًا ونهارًا. " +
  "بقينا ضمن ميزانيتك بفارق آمن دون المساس بجودة القطع الأساسية — كل ريال هنا له سبب مكتوب.";

export default function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variant, setVariant] = useState<VariantId>("balanced");
  const [night, setNight] = useState(false);
  const t = NAJRES_TOTALS;
  const total = variantTotal(variant);
  const animated = useCountUp(total);
  const pct = Math.min(100, Math.round((total / t.budget) * 100));
  const within = total <= t.budget;

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="section shell">
          {/* الملخص + مبدّل النسخ */}
          <div className="card anim-fade-up" style={{ padding: "24px 22px", marginBottom: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 className="h-xl">بيتك جاهز 🎉</h1>
                <p className="muted t-sm" style={{ marginTop: 2 }}>
                  {t.rooms} غرفة · {t.itemCount} عنصرًا مصممًا · صحة التصميم <b className="gold num">{t.health}/100</b>
                </p>
              </div>
              <div style={{ textAlign: "start" }}>
                <div className="dim t-sm">التكلفة الإجمالية</div>
                <div className="num gold" style={{ fontSize: 30, fontWeight: 800 }}>{sar(animated)}</div>
                <div className="t-sm" style={{ color: within ? "var(--success)" : "var(--warning)" }}>
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

          {/* ملاحظات كبير المصممين */}
          <div className="card anim-fade-up" style={{ padding: "22px 22px", marginBottom: 22 }}>
            <span className="chip chip-gold">ملاحظات كبير المصممين</span>
            <p className="muted t-body" style={{ marginTop: 12 }}>{DESIGNER_NOTE}</p>
          </div>

          {/* الغرف */}
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <h2 className="h-lg">غرفك المصممة</h2>
            <button type="button" className="chip" onClick={() => setNight((n) => !n)} style={{ cursor: "pointer", border: "none" }}>
              {night ? "☀ عرض نهاري" : "🌙 عرض ليلي"}
            </button>
          </div>
          <div className="grid-cards stagger">
            {NAJRES_ROOMS.map((r) => (
              <div key={r.key} className="card card-hover" style={{ padding: 14 }}>
                <div className="room-visual" style={{ height: 180 }}>
                  <RoomScene kind={r.key as RoomKind} mode={night ? "night" : "day"} />
                  <div className="caption">
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{r.name}</div>
                    <div className="dim t-sm">{r.area} م² · {r.items} عنصرًا</div>
                  </div>
                </div>
                <p className="muted t-sm" style={{ marginTop: 10, minHeight: 40 }}>{r.highlight}</p>
                <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                  <span className="chip chip-gold num">{sar(roomCost(r.cost, variant))}</span>
                  <span className="dim t-sm">الصور الواقعية قريبًا</span>
                </div>
              </div>
            ))}
          </div>

          {/* القادم */}
          <div className="card" style={{ padding: "22px 20px", marginTop: 22, textAlign: "center" }}>
            <h3 className="h-lg">🚧 هذه أول نظرة فقط</h3>
            <p className="muted t-sm" style={{ maxWidth: 560, margin: "8px auto 0" }}>
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
