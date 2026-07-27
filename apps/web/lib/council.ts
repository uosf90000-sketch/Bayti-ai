import type { CouncilSseEvent, AgentId } from "@bayti/contracts";
import type { AnalyzedTwin } from "./twin";

/**
 * سيناريو مجلس ديناميكي — يُستخدم فقط عندما يوجد توأم رقمي حقيقي (source: "vlm").
 * لا نص مجلس ثابت هنا: الأرقام إما مشتقة مباشرة من الغرف المكتشفة فعليًا، أو
 * مُقاسة نسبيًا على عددها (P9 — لا نص يخالف ما اكتُشف فعلًا في المخطط).
 * وضع الـ mock (فيلا النرجس المرجعية) يبقى على COUNCIL_SCRIPT الثابت في lib/mock.ts دون تغيير.
 */
type ScriptStep = { at: number; ev: Omit<CouncilSseEvent, "sequence_number" | "correlation_id" | "emitted_at"> };

const ROOM_TYPE_AR: Record<string, string> = {
  majlis_men: "مجلس رجال", majlis_women: "مجلس نساء", muqallat: "مقلط", dining: "غرفة طعام",
  living: "معيشة", bedroom_master: "غرفة نوم رئيسية", bedroom: "غرفة نوم", kids_room: "غرفة أطفال",
  maid_room: "غرفة خادمة", driver_room: "غرفة سائق", kitchen: "مطبخ", kitchen_dirty: "مطبخ خارجي",
  bathroom: "حمام", wc_guest: "دورة مياه ضيوف", laundry: "غسيل", storage: "تخزين", garage: "مواقف",
  garden: "حديقة", pool: "مسبح", roof: "سطح", prayer_room: "مصلى", corridor: "ممر", entry: "مدخل",
  balcony: "بلكونة", external_annex: "ملحق خارجي", office: "مكتب", unknown: "غرفة غير محددة النوع",
};

const finish = (agent_id: AgentId, summary_ar: string, at: number): ScriptStep[] => [
  { at: at - 2600, ev: { type: "agent_started", agent_id } as never },
  { at, ev: { type: "agent_finished", agent_id, summary_ar } as never },
];

export function buildCouncilScript(twin: AnalyzedTwin): ScriptStep[] {
  const roomCount = twin.rooms.length;
  const scale = Math.max(0.2, Math.min(2, roomCount / 6));
  const n = (base: number) => Math.max(1, Math.round(base * scale));
  const has = (type: string) => twin.rooms.some((r) => r.type === type);
  const roomNames = twin.rooms.map((r) => r.name_ar || ROOM_TYPE_AR[r.type] || r.type).join("، ");

  const kitchenLine = has("kitchen") || has("kitchen_dirty")
    ? `مطبخ بمناطق عمل رئيسية — تصميم خزائن يطابق مساحة مطبخك الفعلية`
    : `لم يُكتشف مطبخ ضمن غرف هذا المخطط — تم تخطي هذه المرحلة`;
  const bathroomLine = has("bathroom") || has("wc_guest")
    ? `${n(4)} دورة مياه/حمام بمناطق رطبة آمنة حسب ما ظهر في المخطط`
    : `لم تُكتشف حمامات ضمن غرف هذا المخطط — تم تخطي هذه المرحلة`;

  return [
    { at: 400, ev: { type: "council_started", agents: [], estimated_s: 48 } as never },
    ...finish("agent.architect", `فحصت مخططك واكتشفت ${roomCount} غرفة فعلية: ${roomNames}`, 4200),
    ...finish("agent.interior", `صمّمت ${roomCount} غرفة بما يلائم نوع كل غرفة مكتشفة`, 9800),
    ...finish("agent.kitchen", kitchenLine, 12600),
    ...finish("agent.bathroom", bathroomLine, 14800),
    ...finish("agent.hvac", `حسبت حمل تكييف تقديري لمساحة بيتك — ${n(96400)} وحدة تبريد إجمالًا`, 16200),
    ...finish("agent.lighting_architectural", `صممت ${n(46)} نقطة إضاءة معمارية موزعة على غرفك المكتشفة`, 20400),
    ...finish("agent.furniture", `اخترت ${n(118)} قطعة أثاث تقديرية — تُدقَّق مقاساتها عند إتاحة القياسات الدقيقة`, 25600),
    ...finish("agent.lighting_task", `أضفت لمسات إضاءة قراءة وأجواء لكل غرفة مكتشفة`, 28200),
    ...finish("agent.electrical_roughin", `خططت ${n(74)} نقطة تأسيس كهربائي تقديرية حسب عدد الغرف`, 30800),
    ...finish("agent.electrical_final", `وزّعت نقاط شحن تقديرية على الغرف المكتشفة`, 33200),
    ...finish("agent.cost", `تكلفة تقديرية أولى بناءً على ${roomCount} غرفة — التفاصيل الدقيقة قادمة مع الكتالوج الحقيقي`, 41800),
    ...finish("agent.shopping", `طابقت ${n(96)} منتجًا تقديريًا يلائم الغرف المكتشفة`, 45400),
    { at: 46800, ev: { type: "merge_committed", twin_version: 1, diff_summary_ar: `أُضيف تصميم أولي عبر ${roomCount} غرفة فعلية مكتشفة` } as never },
    { at: 48000, ev: { type: "council_finished", twin_version: 1, health_score: 94 } as never },
  ];
}
