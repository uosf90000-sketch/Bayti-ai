"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth } from "@/components/ui";
import { VariantSwitcher, useCountUp } from "@/components/variant";
import { RoomScene, type RoomKind } from "@/components/scene";
import { NAJRES_ROOMS, NAJRES_TOTALS, sar } from "@/lib/mock";
import { roomCost, variantTotal, variantTotalForRooms, type VariantId } from "@/lib/shop";
import { twinStore, type AnalyzedTwin } from "@/lib/twin";
import { resolveRooms, totalsFor, matchedTemplates } from "@/lib/rooms";

/* أول Preview + مبدّل النسخ الثلاث (W4) — الهندسة ثابتة والمنتجات تتبدل (§6.20).
   المشاهد الداخلية رسم SVG من التوأم الرقمي — لا صور فوتوغرافية زائفة قبل الرندر الحقيقي (P8/§8.7)
   في التحليل الحقيقي (source: "vlm") تُعرض فقط الغرف المكتشفة فعليًا — لا يُعرض بيت النرجس المرجعي أبدًا هنا. */

const DESIGNER_NOTE_MOCK =
  "روح هذا التصميم مبنية على التوازن: مجلس New Classic بلمسات ذهبية للضيافة، ومعيشة عائلية Modern دافئة للحياة اليومية. " +
  "وزّعنا 46 نقطة إضاءة على 3 طبقات محسوبة لتُظهر كل زاوية بأفضل حالاتها ليلًا ونهارًا. " +
  "بقينا ضمن ميزانيتك بفارق آمن دون المساس بجودة القطع الأساسية — كل ريال هنا له سبب مكتوب.";

const DESIGNER_NOTE_REAL =
  "هذا أول تصور لتصميم بيتك بناءً على الغرف التي اكتشفناها فعليًا في مخططك. " +
  "التفاصيل الكاملة — المنتجات المخصصة والتكلفة الدقيقة — قادمة مع اكتمال محرك التصميم الكامل.";

export default function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [variant, setVariant] = useState<VariantId>("balanced");
  const [night, setNight] = useState(false);
  const [twin, setTwin] = useState<AnalyzedTwin | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setTwin(twinStore.get(id)); setLoaded(true); }, [id]);

  const isReal = twin?.source === "vlm";

  // Hooks ثابتة الترتيب دائمًا: تُحسب هنا بلا شرط، وتُستخدم فقط في مسار mock أدناه
  const t = NAJRES_TOTALS;
  const total = variantTotal(variant);
  const animated = useCountUp(total);
  const pct = Math.min(100, Math.round((total / t.budget) * 100));
  const within = total <= t.budget;

  if (isReal) {
    return <RealPreview id={id} twin={twin} variant={variant} setVariant={setVariant} night={night} setNight={setNight} />;
  }

  if (loaded && !twin) {
    return (
      <RequireAuth>
        <main>
          <TopBar backHref="/projects" />
          <section className="shell" style={{ paddingTop: 28, paddingBottom: 48, maxWidth: 560, textAlign: "center" }}>
            <div className="glass anim-fade-up" style={{ padding: "30px 24px" }}>
              <div style={{ fontSize: 40 }}>⚠</div>
              <h1 className="h-xl" style={{ marginTop: 8 }}>لا يوجد تصميم بعد لهذا المشروع</h1>
              <p className="muted" style={{ marginTop: 6 }}>ارجع وأكمل رفع المخطط والتحليل أولًا.</p>
              <Link href="/projects" className="btn btn-gold btn-block" style={{ marginTop: 20, minHeight: 54, fontSize: 17 }}>
                العودة للمشاريع
              </Link>
            </div>
          </section>
        </main>
      </RequireAuth>
    );
  }

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
            <p className="muted t-body" style={{ marginTop: 12 }}>{DESIGNER_NOTE_MOCK}</p>
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
              <Link href={`/projects/${id}/chat`} className="chip chip-gold" style={{ cursor: "pointer" }}>
                💬 عدّل بالمحادثة
              </Link>
              {["📄 تقرير PDF", "🏠 جولة 3D", "🖼️ صور واقعية"].map((x) => (
                <span key={x} className="chip">{x}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

const ROOM_TYPE_AR: Record<string, string> = {
  majlis_men: "مجلس رجال", majlis_women: "مجلس نساء", muqallat: "مقلط", dining: "غرفة طعام",
  living: "معيشة", bedroom_master: "غرفة نوم رئيسية", bedroom: "غرفة نوم", kids_room: "غرفة أطفال",
  maid_room: "غرفة خادمة", driver_room: "غرفة سائق", kitchen: "مطبخ", kitchen_dirty: "مطبخ خارجي",
  bathroom: "حمام", wc_guest: "دورة مياه ضيوف", laundry: "غسيل", storage: "تخزين", garage: "مواقف",
  garden: "حديقة", pool: "مسبح", roof: "سطح", prayer_room: "مصلى", corridor: "ممر", entry: "مدخل",
  balcony: "بلكونة", external_annex: "ملحق خارجي", office: "مكتب", unknown: "غير محددة النوع",
};

/** معاينة الوضع الحقيقي — تعرض فقط الغرف المكتشفة فعليًا في التوأم الرقمي (P8/P9) */
function RealPreview({ id, twin, variant, setVariant, night, setNight }: {
  id: string; twin: AnalyzedTwin; variant: VariantId; setVariant: (v: VariantId) => void;
  night: boolean; setNight: (n: boolean | ((p: boolean) => boolean)) => void;
}) {
  const resolved = resolveRooms(twin);
  const templates = matchedTemplates(resolved);
  const totals = totalsFor(resolved);
  const total = variantTotalForRooms(templates, variant);
  const animated = useCountUp(total);
  const pct = totals.budget ? Math.min(100, Math.round((total / totals.budget) * 100)) : 0;
  const within = total <= totals.budget;

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="section shell">
          <div className="card anim-fade-up" style={{ padding: "24px 22px", marginBottom: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 className="h-xl">بيتك جاهز 🎉</h1>
                <p className="muted t-sm" style={{ marginTop: 2 }}>
                  {totals.rooms} غرفة مكتشفة فعليًا · {totals.itemCount} عنصرًا مصممًا حتى الآن
                </p>
              </div>
              {templates.length > 0 && (
                <div style={{ textAlign: "start" }}>
                  <div className="dim t-sm">التكلفة التقديرية (للغرف المصممة حتى الآن)</div>
                  <div className="num gold" style={{ fontSize: 30, fontWeight: 800 }}>{sar(animated)}</div>
                  <div className="t-sm" style={{ color: within ? "var(--success)" : "var(--warning)" }}>
                    {within ? `✓ ضمن ميزانيتك (${sar(totals.budget)})` : `⚠ تتجاوز ميزانيتك بـ ${sar(total - totals.budget)}`}
                  </div>
                </div>
              )}
            </div>
            {templates.length > 0 && (
              <div className="progress-track" style={{ marginTop: 14 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: within ? undefined : "linear-gradient(90deg, var(--warning), var(--danger))" }} />
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <VariantSwitcher value={variant} onChange={setVariant} />
            </div>
            <Link href={`/projects/${id}/shopping`} className="btn btn-gold btn-block" style={{ marginTop: 14, minHeight: 52, fontSize: 16 }}>
              🛍️ قائمة التسوق والاستبدال
            </Link>
          </div>

          <div className="card anim-fade-up" style={{ padding: "22px 22px", marginBottom: 22 }}>
            <span className="chip chip-gold">ملاحظات كبير المصممين</span>
            <p className="muted t-body" style={{ marginTop: 12 }}>{DESIGNER_NOTE_REAL}</p>
          </div>

          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <h2 className="h-lg">غرفك المكتشفة ({resolved.length})</h2>
            {templates.length > 0 && (
              <button type="button" className="chip" onClick={() => setNight((n) => !n)} style={{ cursor: "pointer", border: "none" }}>
                {night ? "☀ عرض نهاري" : "🌙 عرض ليلي"}
              </button>
            )}
          </div>
          <div className="grid-cards stagger">
            {resolved.map((r) =>
              r.matched ? (
                <div key={r.detected.id} className="card card-hover" style={{ padding: 14 }}>
                  <div className="room-visual" style={{ height: 180 }}>
                    <RoomScene kind={r.template.key as RoomKind} mode={night ? "night" : "day"} />
                    <div className="caption">
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{r.detected.name_ar || r.template.name}</div>
                      <div className="dim t-sm">
                        {r.detected.area_m2 != null ? `${r.detected.area_m2} م² (مكتشفة)` : "المساحة غير مؤكدة من المخطط"} · {r.template.items} عنصرًا
                      </div>
                    </div>
                  </div>
                  <p className="muted t-sm" style={{ marginTop: 10, minHeight: 40 }}>{r.template.highlight}</p>
                  <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
                    <span className="chip chip-gold num">{sar(roomCost(r.template.cost, variant))}</span>
                    <span className="dim t-sm">ثقة الاكتشاف {Math.round(r.detected.confidence * 100)}%</span>
                  </div>
                </div>
              ) : (
                <div key={r.detected.id} className="card" style={{ padding: 14 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{r.detected.name_ar || ROOM_TYPE_AR[r.detected.type] || r.detected.type}</div>
                      <div className="dim t-sm" style={{ marginTop: 4 }}>
                        {r.detected.area_m2 != null ? `${r.detected.area_m2} م² (مكتشفة)` : "المساحة غير مؤكدة من المخطط"}
                      </div>
                    </div>
                    <span className="dim t-sm">ثقة {Math.round(r.detected.confidence * 100)}%</span>
                  </div>
                  <p className="muted t-sm" style={{ marginTop: 10 }}>
                    التصميم التفصيلي لهذا النوع من الغرف قادم قريبًا — الغرفة مكتشفة فعليًا لكن لا يوجد لها محتوى تصميم جاهز بعد.
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="card" style={{ padding: "22px 20px", marginTop: 22, textAlign: "center" }}>
            <h3 className="h-lg">🚧 هذه أول نظرة فقط</h3>
            <p className="muted t-sm" style={{ maxWidth: 560, margin: "8px auto 0" }}>
              قادم تباعًا: تصميم تفصيلي لكل نوع غرفة مكتشف، الصور الواقعية، التعديل بالمحادثة، تقرير PDF، والنموذج ثلاثي الأبعاد.
            </p>
            <div className="row" style={{ justifyContent: "center", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
              <Link href={`/projects/${id}/chat`} className="chip chip-gold" style={{ cursor: "pointer" }}>
                💬 عدّل بالمحادثة
              </Link>
              {["📄 تقرير PDF", "🏠 جولة 3D", "🖼️ صور واقعية"].map((x) => (
                <span key={x} className="chip">{x}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
