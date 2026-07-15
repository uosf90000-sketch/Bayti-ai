import Link from "next/link";
import { Brand } from "@/components/ui";
import { AGENTS } from "@/lib/mock";

const steps = [
  { icon: "📄", title: "ارفع مخططك", desc: "PDF أو صورة — حتى من كاميرا جوالك" },
  { icon: "🏛️", title: "المجلس يعمل", desc: "13 خبير ذكاء اصطناعي يصممون بيتك معًا" },
  { icon: "🛍️", title: "استلم بيتك", desc: "تصميم كامل بمنتجات سعودية وأسعار حقيقية" },
];

export default function Landing() {
  return (
    <main>
      <header className="topbar">
        <Brand />
        <Link href="/login" className="btn btn-ghost" style={{ minHeight: 42, padding: "0 20px", fontSize: 15 }}>
          تسجيل الدخول
        </Link>
      </header>

      {/* Hero */}
      <section className="shell" style={{ paddingTop: 56, paddingBottom: 40, textAlign: "center" }}>
        <div className="stagger">
          <span className="chip chip-gold" style={{ marginBottom: 18 }}>
            ✦ أول مجلس ذكاء اصطناعي لتصميم المنازل في السعودية
          </span>
          <h1 className="h-display" style={{ maxWidth: 720, margin: "14px auto 0" }}>
            من <span className="text-gradient">مخططك الورقي</span>
            <br />
            إلى بيت جاهز للتنفيذ
          </h1>
          <p className="muted" style={{ fontSize: 18, maxWidth: 560, margin: "18px auto 0" }}>
            ارفع مخطط منزلك، وخلال دقائق يصمم لك مجلس من خبراء الذكاء الاصطناعي
            كل شيء — الأثاث والإنارة والمطبخ والحمامات — بمنتجات حقيقية من متاجر
            سعودية، وتكلفة تعرفها <b>قبل</b> أن تلتزم.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-gold" style={{ fontSize: 17, minHeight: 54, padding: "0 34px" }}>
              ابدأ بمخططك مجانًا
            </Link>
            <span className="dim" style={{ fontSize: 14 }}>غرفة كاملة هدية — بلا بطاقة</span>
          </div>
        </div>
      </section>

      {/* الرحلة */}
      <section className="shell" style={{ paddingBottom: 44 }}>
        <div className="grid-cards stagger">
          {steps.map((s, i) => (
            <div key={s.title} className="glass glass-hover" style={{ padding: 22 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 30 }}>{s.icon}</span>
                <span className="dim num" style={{ fontSize: 26, fontWeight: 700 }}>{i + 1}</span>
              </div>
              <h3 className="h-lg" style={{ marginTop: 10 }}>{s.title}</h3>
              <p className="muted" style={{ fontSize: 15 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* المجلس */}
      <section className="shell" style={{ paddingBottom: 48 }}>
        <div className="glass" style={{ padding: "26px 22px" }}>
          <h2 className="h-xl" style={{ textAlign: "center" }}>
            مجلسك الخاص من <span className="gold">١٣ خبيرًا</span>
          </h2>
          <p className="muted" style={{ textAlign: "center", marginTop: 6, marginBottom: 20 }}>
            كل خبير متخصص في شيء واحد يتقنه — ويعملون معًا على بيتك أنت
          </p>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {AGENTS.map((a) => (
              <div key={a.id} className="agent-card">
                <span className="agent-avatar">{a.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                  <div className="dim" style={{ fontSize: 12.5 }}>{a.specialty}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الوعد */}
      <section className="shell" style={{ paddingBottom: 56, textAlign: "center" }}>
        <div className="glass" style={{ padding: "34px 22px", background: "linear-gradient(160deg, rgba(194,164,94,0.10), var(--glass-surface))" }}>
          <h2 className="h-xl">كل قطعة نقترحها <span className="gold">تدخل مكانها فعلًا</span></h2>
          <p className="muted" style={{ maxWidth: 520, margin: "12px auto 0", fontSize: 16 }}>
            لا صور خيالية ولا مقاسات تخون. كل تصميم يُفحص هندسيًا، وكل منتج له
            سعر حقيقي ورابط شراء — وكل قرار نشرح لك <b>لماذا</b> اخترناه.
          </p>
          <Link href="/login" className="btn btn-gold" style={{ marginTop: 24, minHeight: 52, padding: "0 32px", fontSize: 16 }}>
            جرّب بيتي الآن
          </Link>
        </div>
        <p className="dim" style={{ marginTop: 28, fontSize: 13 }}>
          بيتي AI — نسخة تجريبية مبكرة · صُنعت بفخر في السعودية 🇸🇦
        </p>
      </section>
    </main>
  );
}
