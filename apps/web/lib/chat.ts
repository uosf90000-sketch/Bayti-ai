/**
 * VS-3 — المحادثة والتعديل (mock بعقود §9 المجمدة):
 * ADR-031: كل تعديل = معاينة → اعتماد → إصدار جديد. C9: الغموض → توضيح لا تخمين.
 */
import { SHOP_ITEMS, variantTotal } from "./shop";

export type EditChange = { text: string; delta: number };
export type EditPreview = {
  intent: string;            // ما فهمه النظام (يُعرض للمستخدم)
  changes: EditChange[];
  costDelta: number;         // موجب = زيادة
  scope: string;             // "مجلس الرجال" / "المشروع كاملًا"
};
export type ChatMsg =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; preview?: EditPreview; clarify?: string[] };

export type Version = {
  n: number; summary: string; total: number; delta: number; at: number;
  restoredFrom?: number;
};

/* ————— الإصدارات (P7: immutable — الرجوع ينشئ نسخة جديدة) ————— */
const VKEY = "bayti.versions.v1";
export const versionsStore = {
  get(projectId: string): Version[] {
    if (typeof window === "undefined") return [];
    try {
      const v = JSON.parse(localStorage.getItem(`${VKEY}:${projectId}`) ?? "null");
      if (Array.isArray(v) && v.length) return v;
    } catch { /* fallthrough */ }
    return [{ n: 1, summary: "تصميم المجلس الأصلي", total: variantTotal("balanced"), delta: 0, at: Date.now() }];
  },
  push(projectId: string, list: Version[]) {
    localStorage.setItem(`${VKEY}:${projectId}`, JSON.stringify(list));
  },
};

/* ————— محلل النوايا (mock حتمي — يُستبدل بـ Intent Parser الحقيقي §9.2) ————— */
const majlisPremiumDelta = () =>
  SHOP_ITEMS.filter((i) => i.roomKey === "majlis")
    .reduce((s, i) => s + (i.premium.balanced.price - i.offers.balanced.price) * i.qty, 0);

const sofaSwapDelta = () => {
  const sofa = SHOP_ITEMS.find((i) => i.id === "sofa_majlis")!;
  return (sofa.cheaper.balanced.price - sofa.offers.balanced.price) * sofa.qty;
};

export function parseIntent(text: string, currentTotal: number): ChatMsg {
  const t = text.trim();

  if (/كنب/.test(t) && /(غير|غيّر|بدل|بدّل|استبدل)/.test(t)) {
    const d = sofaSwapDelta();
    const sofa = SHOP_ITEMS.find((i) => i.id === "sofa_majlis")!;
    return {
      role: "assistant",
      text: "فهمت — تريد تغيير كنب المجلس. هذا ما سأفعله:",
      preview: {
        intent: "استبدال طقم كنب المجلس",
        scope: "مجلس الرجال",
        changes: [
          { text: `استبدال «${sofa.offers.balanced.name}» بـ«${sofa.cheaper.balanced.name}» — نفس المقاس، فُحص هندسيًا ✓`, delta: d },
          { text: "تحديث إضاءة اللمسات المرتبطة بالكنب (إعادة انتقائية — لا يمس باقي الغرف)", delta: 0 },
        ],
        costDelta: d,
      },
    };
  }

  if (/مجلس/.test(t) && /(أفخم|افخم|فخم)/.test(t)) {
    const d = majlisPremiumDelta();
    return {
      role: "assistant",
      text: "ممتاز — سأرقّي المجلس كاملًا للمستوى الأفخم:",
      preview: {
        intent: "ترقية مجلس الرجال للمستوى الفاخر",
        scope: "مجلس الرجال",
        changes: [
          { text: "ترقية طقم الكنب لإصدار محدود بلمسات ذهبية", delta: 4600 },
          { text: "ترقية الثريا لقطعة مستوردة مميزة", delta: 2100 },
          { text: "خامات أفخم للستائر والسجاد (ضمن نفس التوزيع — الهندسة ثابتة)", delta: d - 6700 },
        ],
        costDelta: d,
      },
    };
  }

  const budgetMatch = t.match(/(خفض|خفّض|قلل|قلّل|نزل|نزّل).*?(\d+)\s*(%|بالمئة|في المئة)/);
  if (budgetMatch || (/(خفض|خفّض|قلل|قلّل)/.test(t) && /ميزاني/.test(t))) {
    const pct = budgetMatch ? Math.min(30, parseInt(budgetMatch[2]!, 10)) : 10;
    const cut = Math.round((currentTotal * pct) / 100 / 100) * 100;
    return {
      role: "assistant",
      text: `سأخفض الميزانية ${pct}% بتخفيضات موزونة — لا خفض أعمى (مهندس التكاليف يحمي غرفك الأهم):`,
      preview: {
        intent: `خفض ميزانية المشروع ${pct}%`,
        scope: "المشروع كاملًا",
        changes: [
          { text: "بدائل أوفر للأثاث الثانوي (غرف النوم الإضافية والممرات)", delta: -Math.round(cut * 0.55) },
          { text: "خامات تشطيب أوفر بنفس المظهر (درجة أولى محلية بدل مستوردة)", delta: -Math.round(cut * 0.3) },
          { text: "تبسيط اللمسات الضوئية غير الأساسية", delta: -(cut - Math.round(cut * 0.55) - Math.round(cut * 0.3)) },
        ],
        costDelta: -cut,
      },
    };
  }

  // C9: لا تخمين — توضيح بخيارات حقيقية
  return {
    role: "assistant",
    text: "لم أفهم طلبك تمامًا — ولن أخمّن. أقدر أساعدك بهذه التعديلات حاليًا:",
    clarify: ["غيّر الكنبة", "اجعل المجلس أفخم", "خفّض الميزانية 10%"],
  };
}

export const fmtDelta = (d: number) =>
  d === 0 ? "بدون تغيير" : d > 0 ? `+${d.toLocaleString("en-US")} ريال` : `−${Math.abs(d).toLocaleString("en-US")} ريال`;
