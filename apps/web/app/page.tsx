import Link from "next/link";
import { TopBar, AgentMarquee } from "@/components/ui";
import { HeroScene } from "@/components/scene";
import { AGENTS } from "@/lib/mock";

const steps = [
  { icon: "📄", title: "ارفع مخططك", desc: "PDF أو صورة — حتى من كاميرا جوالك" },
  { icon: "🏛️", title: "المجلس يعمل", desc: "13 خبير ذكاء اصطناعي يصممون بيتك معًا" },
  { icon: "🛍️", title: "استلم بيتك", desc: "تصميم كامل بمنتجات سعودية وأسعار حقيقية" },
];

export default function Landing() {
  return (
    <main>
      <TopBar
        action={
          <Link href="/login" className="btn btn-ghost" style={{ minHeight: 42, padding: "0 20px", fontSize: 15 }}>
            تسجيل الدخول
          </Link>
        }
      />

      {/* Hero — W1: المخطط ينبض بالحياة */}
      <section className="section shell" style={{ textAlign: "center" }}>
        <div className="stagger" style={{ maxWidth: 720, margin: "0 auto" }}>
          <span className="chip chip-gold">✦ أول مجلس ذكاء اصطناعي لتصميم المنازل في السعودية</span>
          <h1 className="h-display" style={{ marginTop: 18 }}>
            من <span className="text-gradient">مخططك الورقي</span>
            <br />
            إلى بيت جاهز للتنفيذ
          </h1>
          <p className="muted h-hero-sub" style={{ maxWidth: 560, margin: "16px auto 0" }}>
            ارفع مخطط منزلك، وخلال دقائق يصمم لك مجلس من خبراء الذكاء الاصطناعي
            كل شيء — الأثاث والإنارة والمطبخ والحمامات — بمنتجات حقيقية من متاجر
            سعودية، وتكلفة تعرفها <b>قبل</b> أن تلتزم.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-gold" style={{ fontSize: 17, minHeight: 54, padding: "0 34px" }}>
              ابدأ بمخططك مجانًا
            </Link>
            <span className="dim t-sm">غرفة كاملة هدية — بلا بطاقة</span>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 640, margin: "40px auto 0", padding: "26px 22px 0", overflow: "hidden" }}>
          <HeroScene />
        </div>
      </section>

      {/* الرحلة */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <div className="grid-cards stagger">
          {steps.map((s, i) => (
            <div key={s.title} className="card card-hover" style={{ padding: 22 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <span className="dim num" style={{ fontSize: 24, fontWeight: 700 }}>{i + 1}</span>
              </div>
              <h3 className="h-lg" style={{ marginTop: 10 }}>{s.title}</h3>
              <p className="muted t-body">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* المجلس */}
      <section className="section shell" style={{ paddingTop: 0 }}>
        <h2 className="h-xl" style={{ textAlign: "center" }}>
          مجلسك الخاص من <span className="gold">١٣ خبيرًا</span>
        </h2>
        <p className="muted t-body" style={{ textAlign: "center", marginTop: 8, marginBottom: 26 }}>
          كل خبير متخصص في شيء واحد يتقنه — ويعملون معًا على بيتك أنت
        </p>
        <AgentMarquee agents={AGENTS} />
      </section>

      {/* الوعد */}
      <section className="section shell" style={{ paddingTop: 0, textAlign: "center" }}>
        <div className="spotlight" style={{ padding: "38px 22px" }}>
          <h2 className="h-xl">كل قطعة نقترحها <span className="gold">تدخل مكانها فعلًا</span></h2>
          <p className="muted t-body" style={{ maxWidth: 520, margin: "14px auto 0" }}>
            لا صور خيالية ولا مقاسات تخون. كل تصميم يُفحص هندسيًا، وكل منتج له
            سعر حقيقي ورابط شراء — وكل قرار نشرح لك <b>لماذا</b> اخترناه.
          </p>
          <Link href="/login" className="btn btn-gold" style={{ marginTop: 26, minHeight: 52, padding: "0 32px", fontSize: 16 }}>
            جرّب بيتي الآن
          </Link>
        </div>
        <p className="dim t-sm" style={{ marginTop: 28 }}>
          بيتي AI — نسخة تجريبية مبكرة · صُنعت بفخر في السعودية 🇸🇦
        </p>
      </section>
    </main>
  );
}
