import type { RoomType } from "@bayti/design-schema";
import { NAJRES_ROOMS } from "./mock";

/**
 * التوأم الرقمي المبسّط لهذه الشريحة (P8: مصدر الحقيقة الوحيد لعدد/نوع الغرف).
 * ملاحظة صادقة: هذا ليس DigitalTwin الكامل المجمَّد في packages/design-schema —
 * ذاك يتطلب جدرانًا/فتحات/نظام إحداثيات دقيق من مسح CAD حقيقي غير متوفر بعد.
 * ما هنا هو الجزء القابل للاستخراج بأمانة من تحليل رؤية حقيقي: عدد الغرف ونوعها
 * وثقة الاكتشاف — ولا شيء يتجاوز ذلك بالتخمين (P9).
 */
export type AnalyzedRoom = {
  id: string;
  type: RoomType;
  name_ar: string;
  area_m2: number | null;
  /** أبعاد إن استُنتجت بثقة من نص/مقياس مكتوب على المخطط — وإلا null (لا تخمين — P9) */
  dimensions_m: { width: number | null; length: number | null; height: number | null } | null;
  confidence: number; // 0..1
};

export type AnalyzedTwin = {
  project_id: string;
  rooms: AnalyzedRoom[];
  source: "vlm" | "mock";
  overall_confidence: number;
  analyzed_at: string;
};

const KEY = "bayti.twin.v1";

export const twinStore = {
  get(projectId: string): AnalyzedTwin | undefined {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = localStorage.getItem(`${KEY}:${projectId}`);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  },
  save(twin: AnalyzedTwin) {
    localStorage.setItem(`${KEY}:${twin.project_id}`, JSON.stringify(twin));
  },
  /** يزرع توأمًا يطابق بيانات فيلا النرجس المرجعية — يُستخدم فقط في وضع mock أو مشروع "مثال" صريح */
  seedMock(projectId: string): AnalyzedTwin {
    const typeByKey: Record<string, RoomType> = {
      majlis: "majlis_men", living: "living", kitchen: "kitchen",
      master: "bedroom_master", kids: "kids_room", dining: "dining",
    };
    const twin: AnalyzedTwin = {
      project_id: projectId,
      source: "mock",
      overall_confidence: 0.97,
      analyzed_at: new Date().toISOString(),
      rooms: NAJRES_ROOMS.map((r) => ({
        id: r.key, type: typeByKey[r.key] ?? "unknown", name_ar: r.name, area_m2: r.area,
        dimensions_m: null, confidence: 0.97,
      })),
    };
    this.save(twin);
    return twin;
  },
};
