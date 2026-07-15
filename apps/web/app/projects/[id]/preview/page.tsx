"use client";
import { use } from "react";
import { TopBar, RequireAuth } from "@/components/ui";
import { NAJRES_ROOMS, NAJRES_TOTALS, sar } from "@/lib/mock";

/* أول Preview — كل رقم هنا يأتي من بيانات المشروع (mock فيلا النرجس §6.19)،
   والصور تدرجات مؤقتة عمدًا: لا صور زائفة قبل الرندر الحقيقي (P8/§8.7) */

export default function Preview({ params }: { params: Promise<{ id: string }> }) {
  use(params);
  const t = NAJRES_TOTALS;
  const pct = Math.round((t.total / t.budget) * 100);

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="shell" style={{ paddingTop: 24, paddingBottom: 56 }}>
          {/* الملخص */}
          <div className="glass anim-fade-up" style={{ padding: "24px 22px", marginBottom: 18, background: "linear-gradient(160deg, rgba(194,164,94,0.09), var(--glass-surface))" }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 className="h-xl">بيتك جاهز 🎉</h1>
                <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>
                  {t.rooms} غرفة · {t.itemCount} عنصرًا مصممًا · صحة التصميم <b className="gold num">{t.health}/100</b>
                </p>
              </div>
              <div style={{ textAlign: "start" }}>
                <div className="dim" style={{ fontSize: 13 }}>التكلفة الإجمالية (النسخة المتوازنة)</div>
                <div className="num" style={{ fontSize: 30, fontWeight: 800, color: "var(--gold-300)" }}>{sar(t.total)}</div>
                <div style={{ fontSize: 13, color: "var(--savings)" }}>
                  ✓ ضمن ميزانيتك ({sar(t.budget)}) — استخدمنا {pct}%
                </div>
              </div>
            </div>
            <div className="progress-track" style={{ marginTop: 14 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
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
                  <span className="chip chip-gold num">{sar(r.cost)}</span>
                  <span className="dim" style={{ fontSize: 12 }}>الصور الواقعية قريبًا</span>
                </div>
              </div>
            ))}
          </div>

          {/* القادم */}
          <div className="glass" style={{ padding: "22px 20px", marginTop: 22, textAlign: "center" }}>
            <h3 className="h-lg">🚧 هذه أول نظرة فقط</h3>
            <p className="muted" style={{ maxWidth: 560, margin: "8px auto 0", fontSize: 14.5 }}>
              قادم في التحديثات التالية: الصور الواقعية لكل غرفة، النسخ الثلاث (اقتصادي/متوازن/فاخر)،
              قائمة التسوق بروابط المتاجر السعودية، التعديل بالمحادثة، والنموذج ثلاثي الأبعاد.
            </p>
            <div className="row" style={{ justifyContent: "center", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
              {["🛍️ قائمة التسوق", "🎨 النسخ الثلاث", "💬 عدّل بالمحادثة", "🏠 جولة 3D"].map((x) => (
                <span key={x} className="chip">{x}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
