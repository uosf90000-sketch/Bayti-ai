"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar, RequireAuth } from "@/components/ui";
import { store } from "@/lib/mock";
import { flags } from "@/lib/flags";
import { twinStore, type AnalyzedTwin } from "@/lib/twin";

/* مراحل التحليل — في وضع mock تحاكي زمن العملية الحقيقية؛ في الوضع الحقيقي
   التحليل الفعلي يكون قد اكتمل بالفعل (استُدعي في شاشة الرفع) وهذه مجرد
   حركة عرض قصيرة قبل كشف النتائج الحقيقية المخزّنة في twinStore. */
const STAGES = [
  { key: "quality", label: "فحص جودة الملف", icon: "🔍", d: 1400 },
  { key: "walls", label: "كشف الجدران والفتحات", icon: "🧱", d: 2600 },
  { key: "rooms", label: "تحديد الغرف ومساحاتها", icon: "📐", d: 2800 },
  { key: "labels", label: "قراءة الأسماء العربية", icon: "🔤", d: 2200 },
  { key: "twin", label: "بناء التوأم الرقمي لبيتك", icon: "🏛️", d: 1800 },
];
const REAL_STAGE_SCALE = 0.12; // العمل الحقيقي منجز فعلًا — هذه حركة عرض فقط

const ROOM_TYPE_AR: Record<string, string> = {
  majlis_men: "مجلس رجال", majlis_women: "مجلس نساء", muqallat: "مقلط", dining: "غرفة طعام",
  living: "معيشة", bedroom_master: "غرفة نوم رئيسية", bedroom: "غرفة نوم", kids_room: "غرفة أطفال",
  maid_room: "غرفة خادمة", driver_room: "غرفة سائق", kitchen: "مطبخ", kitchen_dirty: "مطبخ خارجي",
  bathroom: "حمام", wc_guest: "دورة مياه ضيوف", laundry: "غسيل", storage: "تخزين", garage: "مواقف",
  garden: "حديقة", pool: "مسبح", roof: "سطح", prayer_room: "مصلى", corridor: "ممر", entry: "مدخل",
  balcony: "بلكونة", external_annex: "ملحق خارجي", office: "مكتب", unknown: "غير محددة النوع",
};

export default function Analysis({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isMock = flags.USE_MOCK_ANALYSIS;
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [twin, setTwin] = useState<AnalyzedTwin | undefined>(undefined);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const next = async () => {
      if (i < STAGES.length) {
        setStage(i);
        t = setTimeout(() => { i += 1; next(); }, isMock ? STAGES[i]!.d : Math.round(STAGES[i]!.d * REAL_STAGE_SCALE));
      } else {
        if (isMock) {
          setTwin(await twinStore.seedMock(id));
        } else {
          const real = twinStore.get(id);
          if (!real) { setMissing(true); return; }
          setTwin(real);
        }
        setDone(true);
        store.update(id, { status: "needs_review" });
      }
    };
    next();
    return () => clearTimeout(t);
  }, [id, isMock]);

  const progress = done ? 100 : Math.round(((stage + 0.5) / STAGES.length) * 100);
  const detectedNames = twin?.rooms.map((r) => r.name_ar || ROOM_TYPE_AR[r.type] || r.type) ?? [];
  const confidencePct = twin ? Math.round(twin.overall_confidence * 100) : null;

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="shell" style={{ paddingTop: 28, paddingBottom: 48, maxWidth: 620, minHeight: "calc(100dvh - 140px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {missing ? (
            <div className="glass anim-fade-up" style={{ padding: "30px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>⚠</div>
              <h1 className="h-xl" style={{ marginTop: 8 }}>لم نجد نتيجة تحليل لهذا المشروع</h1>
              <p className="muted" style={{ marginTop: 6 }}>
                يبدو أن التحليل لم يكتمل — ارجع وارفع المخطط من جديد.
              </p>
              <button className="btn btn-gold btn-block" style={{ marginTop: 20, minHeight: 54, fontSize: 17 }} onClick={() => router.push("/projects/new")}>
                رفع مخطط جديد
              </button>
            </div>
          ) : !done ? (
            <div className="stage-cinema anim-fade-up" style={{ padding: "40px 10px" }}>
              <span className="dim t-sm">يمكنك المغادرة والعودة — لن تفقد شيئًا</span>
              <div key={STAGES[stage]!.key} className="stage-icon anim-fade-in">{STAGES[stage]!.icon}</div>
              <h1 className="h-xl">{STAGES[stage]!.label}</h1>
              <div className="progress-track" style={{ width: "min(100%, 360px)" }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="stage-rail" role="progressbar" aria-valuenow={stage + 1} aria-valuemin={1} aria-valuemax={STAGES.length}>
                {STAGES.map((s, i) => (
                  <span key={s.key} className="seg" data-state={i < stage ? "done" : i === stage ? "active" : undefined} />
                ))}
              </div>
            </div>
          ) : (
            <div className="glass anim-fade-up" style={{ padding: "30px 24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44 }}>🎉</div>
                <h1 className="h-xl" style={{ marginTop: 8 }}>فهمنا بيتك!</h1>
                <p className="muted" style={{ marginTop: 6 }}>
                  اكتشفنا <b className="gold">{twin?.rooms.length ?? 0} غرفة</b> فعليًا من مخططك
                  {confidencePct !== null && <> — بثقة <b className="num">{confidencePct}%</b></>}
                </p>
              </div>
              <div className="row" style={{ flexWrap: "wrap", justifyContent: "center", marginTop: 18, gap: 8 }}>
                {detectedNames.map((r, i) => <span key={`${r}-${i}`} className="chip">{r}</span>)}
              </div>
              <div className="stack" style={{ marginTop: 24 }}>
                <button
                  className="btn btn-gold btn-block" style={{ minHeight: 54, fontSize: 17 }}
                  onClick={() => { store.update(id, { status: "generating" }); router.push(`/projects/${id}/council`); }}
                >
                  يبدو صحيحًا — ابدأ التصميم 🏛️
                </button>
                <p className="dim" style={{ fontSize: 13, textAlign: "center" }}>
                  شاشة المراجعة والتصحيح التفصيلية قادمة في التحديث التالي — حاليًا ننتقل مباشرة للمجلس
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </RequireAuth>
  );
}
