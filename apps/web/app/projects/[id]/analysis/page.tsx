"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar, RequireAuth } from "@/components/ui";
import { store } from "@/lib/mock";

/* مراحل التحليل الحقيقية من §4.12 — الـ mock يحاكي نفس العقد */
const STAGES = [
  { key: "quality", label: "فحص جودة الملف", d: 1400 },
  { key: "walls", label: "كشف الجدران والفتحات", d: 2600 },
  { key: "rooms", label: "تحديد الغرف ومساحاتها", d: 2800 },
  { key: "labels", label: "قراءة الأسماء العربية", d: 2200 },
  { key: "twin", label: "بناء التوأم الرقمي لبيتك", d: 1800 },
];

const FOUND_ROOMS = [
  "مجلس الرجال", "المقلط", "المعيشة", "المطبخ", "نوم رئيسية",
  "نوم أطفال ×3", "4 حمامات", "غرفة خادمة", "مدخل وممرات",
];

export default function Analysis({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      if (i < STAGES.length) {
        setStage(i);
        t = setTimeout(() => { i += 1; next(); }, STAGES[i]!.d);
      } else {
        setDone(true);
        store.update(id, { status: "needs_review" });
      }
    };
    next();
    return () => clearTimeout(t);
  }, [id]);

  const progress = done ? 100 : Math.round(((stage + 0.5) / STAGES.length) * 100);

  return (
    <RequireAuth>
      <main>
        <TopBar backHref="/projects" />
        <section className="shell" style={{ paddingTop: 28, paddingBottom: 48, maxWidth: 620 }}>
          {!done ? (
            <div className="glass anim-fade-up" style={{ padding: "30px 24px" }}>
              <h1 className="h-xl" style={{ textAlign: "center" }}>نقرأ مخططك الآن…</h1>
              <p className="muted" style={{ textAlign: "center", fontSize: 14, marginTop: 4 }}>
                يمكنك المغادرة والعودة — لن تفقد شيئًا
              </p>
              <div className="progress-track" style={{ marginTop: 22 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="stack" style={{ marginTop: 22, gap: 10 }}>
                {STAGES.map((s, i) => (
                  <div key={s.key} className="agent-card" data-state={i < stage ? "done" : i === stage ? "working" : undefined}>
                    <span className="agent-avatar" style={{ fontSize: 15 }}>
                      {i < stage ? "✓" : i === stage ? "⏳" : "·"}
                    </span>
                    <span style={{ fontWeight: i === stage ? 700 : 500, fontSize: 15 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass anim-fade-up" style={{ padding: "30px 24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44 }}>🎉</div>
                <h1 className="h-xl" style={{ marginTop: 8 }}>فهمنا بيتك!</h1>
                <p className="muted" style={{ marginTop: 6 }}>
                  اكتشفنا <b className="gold">14 غرفة</b> عبر دورين بمساحة <b className="num">380 م²</b> — بثقة <b className="num">96%</b>
                </p>
              </div>
              <div className="row" style={{ flexWrap: "wrap", justifyContent: "center", marginTop: 18, gap: 8 }}>
                {FOUND_ROOMS.map((r) => <span key={r} className="chip">{r}</span>)}
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
