/**
 * طبقة الـ Mock (§12.2 Contract-First + Mock-First):
 * تطبّق عقود @bayti/contracts حرفيًا — الاستبدال بالخدمات الحقيقية يقلب flag فقط،
 * صفر تغيير في كود الشاشات (AC12-3). بيانات "فيلا حي النرجس" هي المرجع (PRD §6.19).
 */
import type { CouncilSseEvent, AgentId, ProjectStatus } from "@bayti/contracts";

/* ————— الوكلاء (أسماء عرض عربية — قاعدة S8) ————— */
export const AGENTS: { id: AgentId; name: string; specialty: string; emoji: string }[] = [
  { id: "agent.architect", name: "المهندس المعماري", specialty: "فهم المخطط وتقسيم المناطق", emoji: "📐" },
  { id: "agent.interior", name: "مصممة الديكور", specialty: "المفاهيم والخامات والألوان", emoji: "🎨" },
  { id: "agent.kitchen", name: "مصمم المطابخ", specialty: "الخزائن والأجهزة بالملليمتر", emoji: "🍳" },
  { id: "agent.bathroom", name: "مصممة الحمامات", specialty: "الأطقم والمناطق الرطبة", emoji: "🛁" },
  { id: "agent.landscape", name: "مهندس الحدائق", specialty: "الحوش والواجهة والجلسات", emoji: "🌿" },
  { id: "agent.hvac", name: "مهندس التكييف", specialty: "حساب الأحمال ومواقع الوحدات", emoji: "❄️" },
  { id: "agent.lighting_architectural", name: "مهندسة الإضاءة", specialty: "الإنارة المعمارية المحسوبة", emoji: "💡" },
  { id: "agent.furniture", name: "خبير الأثاث", specialty: "قطع تدخل أماكنها فعلًا", emoji: "🛋️" },
  { id: "agent.lighting_task", name: "إضاءة الأجواء", specialty: "إنارة القراءة واللمسات", emoji: "✨" },
  { id: "agent.electrical_roughin", name: "مهندس الكهرباء", specialty: "التأسيس والدوائر", emoji: "⚡" },
  { id: "agent.electrical_final", name: "الكهرباء النهائية", specialty: "نقاط تخدم أثاثك الفعلي", emoji: "🔌" },
  { id: "agent.cost", name: "مهندس التكاليف", specialty: "كل ريال له سبب", emoji: "🧮" },
  { id: "agent.shopping", name: "خبيرة التسوق", specialty: "منتجات سعودية حقيقية", emoji: "🛍️" },
];

/* ————— سيناريو المجلس (مطابق لعقد CouncilSseEvent) ————— */
type ScriptStep = { at: number; ev: Omit<CouncilSseEvent, "sequence_number" | "correlation_id" | "emitted_at"> };

const finish = (agent_id: AgentId, summary_ar: string, at: number): ScriptStep[] => [
  { at: at - 2600, ev: { type: "agent_started", agent_id } as never },
  { at, ev: { type: "agent_finished", agent_id, summary_ar } as never },
];

export const COUNCIL_SCRIPT: ScriptStep[] = [
  { at: 400, ev: { type: "council_started", agents: [], estimated_s: 48 } as never },
  ...finish("agent.architect", "قسّمت المنزل: جناح ضيوف مستقل، وجناح عائلي هادئ — 14 غرفة عبر دورين", 4200),
  ...finish("agent.interior", "صمّمت 9 غرف: New Classic للمجالس وModern دافئ للجناح العائلي", 9800),
  ...finish("agent.kitchen", "مطبخ بمناطق العمل الخمس — 14 وحدة خزائن تطابق جدارك بالملليمتر", 12600),
  ...finish("agent.bathroom", "4 حمامات بمناطق رطبة آمنة — وحمام الوالدة بمواصفات وصول كاملة", 14800),
  ...finish("agent.hvac", "حسبت 96,400 وحدة تبريد للمنزل — المجلس الغربي يحتاج وحدتين", 16200),
  ...finish("agent.lighting_architectural", "صممت 46 نقطة إضاءة معمارية على 3 طبقات محسوبة بالـ lumen", 20400),
  ...finish("agent.furniture", "اخترت 118 قطعة — كل قطعة تم التحقق أنها تدخل مكانها فعلًا", 25600),
  ...finish("agent.lighting_task", "أضفت إضاءة قراءة بجانب كل جلسة، ولمسات ضوئية للوحات المجلس", 28200),
  ...finish("agent.electrical_roughin", "خططت 74 نقطة تأسيس كهربائي و12 دائرة إنارة", 30800),
  ...finish("agent.electrical_final", "أضفت نقاط شحن بجانب كل سرير وجلسة — كل نقطة لها سبب", 33200),
  { at: 35400, ev: { type: "conflict_detected", severity: "major", summary_ar: "وحدة التكييف تتعارض مع موقع اللوحة الجدارية في المجلس" } as never },
  { at: 37600, ev: { type: "conflict_resolved", summary_ar: "نُقلت اللوحة للجدار الشرقي — السلامة وقابلية التنفيذ أولًا" } as never },
  ...finish("agent.cost", "التكلفة الإجمالية 271,400 ريال — ضمن ميزانيتك بفارق آمن", 41800),
  ...finish("agent.shopping", "طابقت 96 منتجًا من متاجر سعودية، مع بديل أرخص وأفخم لكل قطعة", 45400),
  { at: 46800, ev: { type: "merge_committed", twin_version: 3, diff_summary_ar: "أُضيف 214 عنصرًا عبر 13 غرفة" } as never },
  { at: 48000, ev: { type: "council_finished", twin_version: 3, health_score: 94 } as never },
];

/* ————— نتيجة فيلا النرجس (الـ Preview الأول) ————— */
export type RoomPreview = {
  key: string; name: string; area: number; items: number; cost: number;
  gradient: string; highlight: string;
};

export const NAJRES_ROOMS: RoomPreview[] = [
  { key: "majlis", name: "مجلس الرجال", area: 29.8, items: 24, cost: 48200, gradient: "linear-gradient(135deg,#2b2416,#4d3f22,#1f2c4d)", highlight: "New Classic — كنب 12 مقعدًا وثريا مركزية" },
  { key: "living", name: "المعيشة العائلية", area: 34.2, items: 31, cost: 39800, gradient: "linear-gradient(135deg,#1f2c4d,#2e3f63,#16203a)", highlight: "Modern دافئ — ركن تلفاز وجلسة عائلية" },
  { key: "kitchen", name: "المطبخ الرئيسي", area: 18.6, items: 22, cost: 52400, gradient: "linear-gradient(135deg,#20301f,#33492e,#16203a)", highlight: "مناطق عمل خمس + جزيرة تحضير" },
  { key: "master", name: "غرفة النوم الرئيسية", area: 26.4, items: 18, cost: 34600, gradient: "linear-gradient(135deg,#2d1f33,#463253,#16203a)", highlight: "جناح كامل بغرفة ملابس وإضاءة هادئة" },
  { key: "kids", name: "غرف الأطفال (٣)", area: 42.0, items: 36, cost: 41200, gradient: "linear-gradient(135deg,#1e3140,#2f4d5e,#16203a)", highlight: "خامات آمنة قابلة للتنظيف وزوايا محمية" },
  { key: "dining", name: "المقلط وغرفة الطعام", area: 21.5, items: 14, cost: 28400, gradient: "linear-gradient(135deg,#33261a,#4d3c28,#16203a)", highlight: "طاولة 12 شخصًا وإنارة معلقة محسوبة" },
];

export const NAJRES_TOTALS = { budget: 280000, total: 271400, itemCount: 214, rooms: 13, health: 94 };

/* ————— مخزن محلي (يُستبدل بالـ API الحقيقي خلف نفس الواجهة) ————— */
export type StoredProject = {
  id: string; title: string;
  status: ProjectStatus;
  fileName: string | null; createdAt: number;
};

const KEY = "bayti.projects.v1";
const AUTH = "bayti.auth.v1";

export const store = {
  isAuthed: (): boolean => typeof window !== "undefined" && !!localStorage.getItem(AUTH),
  login: (phone: string) => localStorage.setItem(AUTH, JSON.stringify({ phone, at: Date.now() })),
  logout: () => localStorage.removeItem(AUTH),

  list: (): StoredProject[] => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
  },
  save(list: StoredProject[]) { localStorage.setItem(KEY, JSON.stringify(list)); },
  create(title: string): StoredProject {
    const p: StoredProject = { id: `prj_${Date.now().toString(36)}`, title, status: "uploaded", fileName: null, createdAt: Date.now() };
    this.save([p, ...this.list()]);
    return p;
  },
  get(id: string): StoredProject | undefined { return this.list().find((p) => p.id === id); },
  update(id: string, patch: Partial<StoredProject>) {
    this.save(this.list().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
};

export const sar = (n: number) => `${n.toLocaleString("en-US")} ريال`;
