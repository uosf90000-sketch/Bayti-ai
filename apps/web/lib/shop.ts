/**
 * شريحة النسخ الثلاث والتسوق — mock بعقود DesignVariant/ShoppingCandidate المجمدة.
 * قاعدة مؤسس: المتاجر هنا "تجريبية" معلنة بوضوح — لا روابط وهمية تدّعي أنها حقيقية.
 */
import { NAJRES_ROOMS, type RoomPreview } from "./mock";

export type VariantId = "economy" | "balanced" | "luxury";

export const VARIANTS: { id: VariantId; label: string; desc: string; icon: string }[] = [
  { id: "economy", label: "اقتصادي", desc: "ذكاء في كل ريال", icon: "🌱" },
  { id: "balanced", label: "متوازن", desc: "أفضل قيمة مقابل سعر", icon: "⚖️" },
  { id: "luxury", label: "فاخر", desc: "بلا مساومة", icon: "👑" },
];

/* معاملات النسخ على تكلفة الغرف (الهندسة ثابتة — المنتجات والخامات تتغير §6.20) */
const MULT: Record<VariantId, number> = { economy: 0.72, balanced: 1, luxury: 1.55 };

export const roomCost = (base: number, v: VariantId) => Math.round((base * MULT[v]) / 100) * 100;
export const variantTotalForRooms = (rooms: RoomPreview[], v: VariantId) =>
  rooms.reduce((s, r) => s + roomCost(r.cost, v), 0);
export const variantTotal = (v: VariantId) => variantTotalForRooms(NAJRES_ROOMS, v);

/* ————— عناصر التسوق البارزة (Hero Items) ————— */
export type ProductOffer = { name: string; store: string; price: number };
export type ShopItem = {
  id: string; roomKey: string; roomName: string; emoji: string;
  title: string; spec: string; qty: number;
  offers: Record<VariantId, ProductOffer>;      // المنتج الأساسي لكل نسخة
  cheaper: Record<VariantId, ProductOffer>;     // بديل أرخص (نفس المقاس — فُحص هندسيًا)
  premium: Record<VariantId, ProductOffer>;     // بديل أفخم
};

const D = "متجر تجريبي"; // Demo store — سيُستبدل بالكتالوج الحقيقي (§7)
const o = (name: string, price: number, store = D): ProductOffer => ({ name, store, price });

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "sofa_majlis", roomKey: "majlis", roomName: "مجلس الرجال", emoji: "🛋️",
    title: "طقم كنب المجلس (12 مقعدًا)", spec: "قماش مخمل مقاوم للبقع · 220×95 سم للقطعة", qty: 1,
    offers: { economy: o("طقم عربي كلاسيك", 14200), balanced: o("طقم نيو كلاسيك فاخر القماش", 21800), luxury: o("طقم ملكي بتطريز يدوي", 38500) },
    cheaper: { economy: o("طقم أساسي متين", 11900), balanced: o("نفس التصميم بقماش أخف", 18200), luxury: o("نفس الفخامة بخشب محلي", 32800) },
    premium: { economy: o("ترقية لقماش أفخم", 16800), balanced: o("إصدار محدود بلمسات ذهبية", 26400), luxury: o("تفصيل خاص باسمك", 47200) },
  },
  {
    id: "chandelier", roomKey: "majlis", roomName: "مجلس الرجال", emoji: "💎",
    title: "الثريا المركزية", spec: "قطر 90 سم · ارتفاع معلق محسوب 210 سم عن الأرض", qty: 1,
    offers: { economy: o("ثريا كريستال أكريليك", 1850), balanced: o("ثريا كريستال حقيقي", 4200), luxury: o("ثريا تشيكية فاخرة", 9800) },
    cheaper: { economy: o("ثريا معدنية أنيقة", 1200), balanced: o("كريستال مخلوط", 3100), luxury: o("كريستال أوروبي درجة ثانية", 7400) },
    premium: { economy: o("ترقية لكريستال مخلوط", 2600), balanced: o("قطعة مستوردة مميزة", 6300), luxury: o("قطعة فنية بتوقيع مصمم", 14500) },
  },
  {
    id: "tv_unit", roomKey: "living", roomName: "المعيشة العائلية", emoji: "📺",
    title: "ركن التلفاز المتكامل", spec: "جدارية 320 سم · خشب + إضاءة مخفية من خطة الإنارة", qty: 1,
    offers: { economy: o("وحدة خشب صناعي", 3400), balanced: o("وحدة MDF بقشرة بلوط", 6800), luxury: o("خشب طبيعي بتصميم خاص", 14200) },
    cheaper: { economy: o("وحدة أبسط بدون إضاءة", 2600), balanced: o("نفس القياس بخامة أخف", 5400), luxury: o("قشرة طبيعية بدل الخشب الصلب", 11200) },
    premium: { economy: o("إضافة إضاءة مخفية", 4300), balanced: o("ترقية لخشب شبه صلب", 8900), luxury: o("رخام + خشب بتصميم النحات", 19800) },
  },
  {
    id: "dining_table", roomKey: "dining", roomName: "المقلط", emoji: "🍽️",
    title: "طاولة الطعام (12 شخصًا)", spec: "300×120 سم · ممر خدمة 90 سم مؤكد حول الطاولة", qty: 1,
    offers: { economy: o("سطح سيراميك وقواعد معدن", 4800), balanced: o("خشب زان بسطح رخامي", 9600), luxury: o("رخام إيطالي كامل", 21400) },
    cheaper: { economy: o("سطح زجاج مقوى", 3900), balanced: o("رخام صناعي فاخر الملمس", 7800), luxury: o("رخام محلي درجة أولى", 17200) },
    premium: { economy: o("ترقية لرخام صناعي", 6200), balanced: o("رخام طبيعي مع كراسي جلد", 13400), luxury: o("قطعة وحيدة منحوتة", 29800) },
  },
  {
    id: "kitchen_appliances", roomKey: "kitchen", roomName: "المطبخ", emoji: "🍳",
    title: "حزمة الأجهزة الرئيسية", spec: "ثلاجة 90 سم + فرن مزدوج + غسالة صحون — أبعاد التركيب مطابقة للخزائن", qty: 1,
    offers: { economy: o("حزمة موثوقة اقتصادية", 8900), balanced: o("حزمة ستانلس متكاملة", 16800), luxury: o("حزمة مدمجة أوروبية", 34200) },
    cheaper: { economy: o("حزمة أساسية بضمان سنتين", 7200), balanced: o("نفس المواصفات بعلامة أحدث", 13900), luxury: o("الفئة الثانية من نفس العلامة", 27800) },
    premium: { economy: o("ترقية الثلاجة لباب مزدوج", 11400), balanced: o("إضافة فرن بخار", 21600), luxury: o("سلسلة الشيف الاحترافية", 44800) },
  },
  {
    id: "master_bed", roomKey: "master", roomName: "النوم الرئيسية", emoji: "🛏️",
    title: "سرير رئيسي مع الخلفية", spec: "كينج 200×200 · خلفية منجدة بعرض الجدار 320 سم", qty: 1,
    offers: { economy: o("سرير منجد أنيق", 3600), balanced: o("سرير بخلفية جدارية كاملة", 7400), luxury: o("جناح نوم متكامل", 16800) },
    cheaper: { economy: o("سرير بخلفية أصغر", 2800), balanced: o("نفس التصميم بقماش أخف", 5900), luxury: o("بدون الجناح الجانبي", 13200) },
    premium: { economy: o("إضافة تنجيد جداري", 5100), balanced: o("ترقية لمخمل مستورد", 9800), luxury: o("تفصيل مع إضاءة مدمجة", 22400) },
  },
  {
    id: "kids_furniture", roomKey: "kids", roomName: "غرف الأطفال", emoji: "🧸",
    title: "تأثيث الغرف الثلاث", spec: "أسرّة + مكاتب + دواليب — زوايا آمنة وخامات قابلة للتنظيف (SAF-CHD)", qty: 3,
    offers: { economy: o("حزمة عملية مرحة", 9800), balanced: o("حزمة متكاملة بألوان هادئة", 16200), luxury: o("غرف بثيمات مخصصة", 28400) },
    cheaper: { economy: o("حزمة أساسية آمنة", 8100), balanced: o("نفس الجودة بتشكيلة أبسط", 13400), luxury: o("ثيمات جاهزة بدل المخصصة", 23600) },
    premium: { economy: o("إضافة زوايا دراسة", 12200), balanced: o("ترقية لخشب طبيعي", 20800), luxury: o("تصميم مخصص مع أسماء", 36200) },
  },
];

/* ————— اختيارات المستخدم (بديل أرخص/أفخم لكل عنصر) — تُخزن لكل نسخة ————— */
export type Choice = "primary" | "cheaper" | "premium";
type Choices = Record<string, Choice>;
const CKEY = "bayti.choices.v1";

export const choicesStore = {
  get(projectId: string, v: VariantId): Choices {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(`${CKEY}:${projectId}:${v}`) ?? "{}"); } catch { return {}; }
  },
  set(projectId: string, v: VariantId, c: Choices) {
    localStorage.setItem(`${CKEY}:${projectId}:${v}`, JSON.stringify(c));
  },
};

export const offerFor = (item: ShopItem, v: VariantId, c: Choice): ProductOffer =>
  c === "cheaper" ? item.cheaper[v] : c === "premium" ? item.premium[v] : item.offers[v];

/** التوفير (W6): مجموع ما وفره المستخدم باختيار بدائل أرخص في النسخة الحالية */
export const savings = (v: VariantId, choices: Choices, items: ShopItem[] = SHOP_ITEMS) =>
  items.reduce((s, it) => {
    if (choices[it.id] === "cheaper") s += (it.offers[v].price - it.cheaper[v].price) * it.qty;
    return s;
  }, 0);

/** إجمالي العناصر البارزة بعد الاختيارات (يُستخدم لعرض أثر الاستبدال) */
export const heroTotal = (v: VariantId, choices: Choices, items: ShopItem[] = SHOP_ITEMS) =>
  items.reduce((s, it) => s + offerFor(it, v, choices[it.id] ?? "primary").price * it.qty, 0);

/** يُبقي فقط عناصر التسوق التي تخص غرفًا مكتشفة فعليًا (لا تسوق لغرفة لم تُكتشف — التوأم الرقمي مصدر الحقيقة) */
export const shopItemsForKeys = (keys: Set<string>) => SHOP_ITEMS.filter((it) => keys.has(it.roomKey));
