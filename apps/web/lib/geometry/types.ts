/**
 * محرك CAD/BIM حقيقي — طبقة هندسة تُشتق من التحليل البصري الفعلي (Claude Vision)
 * لغرفة/مخطط بعينه، وتُستخدم لبناء مشهد Three.js حقيقي بدل صناديق تخطيطية.
 *
 * قرار نطاق موثّق (راجع docs/CAD_ENGINE.md): هذا **ليس** DigitalTwin الكامل
 * المجمَّد في packages/design-schema/src/twin.ts (ذاك يفترض نظام إحداثيات
 * "مؤكَّد" بالأمتار من مسح CAD حقيقي — غير متاح من صورة واحدة). هنا:
 * - الإحداثيات نسبية لأبعاد الصورة (0..1) ما لم يُعثر على نص مقياس/بُعد
 *   مكتوب صراحة على المخطط (عندها scale.status = "confirmed" وتُحوَّل
 *   لأمتار حقيقية عبر meters_per_unit).
 * - كل عنصر (جدار/فتحة/غرفة) يحمل confidence حقيقيًا لا رقمًا ثابتًا.
 * - لا عنصر يُعرض في الواجهة بلا سند من هذا التحليل (P9 — لا اختلاق تفاصيل).
 */

export type Vec2 = [number, number];

export type WallKind = "exterior" | "interior" | "unknown";

export type WallSegment = {
  id: string;
  from: Vec2;
  to: Vec2;
  /** سماكة الجدار بالأمتار — فقط إن استُنتجت من نص/مقياس مكتوب، وإلا null */
  thickness_m: number | null;
  height_m: number | null;
  kind: WallKind;
  confidence: number;
};

export type OpeningType = "door" | "window";

export type Opening = {
  id: string;
  wall_id: string;
  type: OpeningType;
  /** نقطة تقريبية لمركز الفتحة على نفس نظام إحداثيات الجدران */
  position: Vec2;
  width_m: number | null;
  confidence: number;
};

export type RoomGeometry = {
  /** يطابق AnalyzedRoom.id من lib/twin.ts — نفس الغرفة المكتشفة، هندستها فقط */
  room_id: string;
  /** حدود الغرفة التقريبية (3 نقاط فأكثر) بنفس نظام إحداثيات الجدران */
  polygon: Vec2[];
  /** زاوية اتجاه الغرفة بالدرجات (شمال = 0) إن أمكن استنتاجها بثقة، وإلا null */
  orientation_deg: number | null;
  confidence: number;
};

export type CoordinateScale = {
  status: "confirmed" | "unconfirmed";
  /** كم مترًا يمثّله وحدة إحداثي واحدة (1.0 في نظام الصورة النسبي) — فقط إن status="confirmed" */
  meters_per_unit: number | null;
  source: "written_dims" | "scale_text" | "missing";
};

export type FloorGeometry = {
  project_id: string;
  scale: CoordinateScale;
  walls: WallSegment[];
  openings: Opening[];
  rooms: RoomGeometry[];
  /** ثقة إجمالية في جودة استخراج الهندسة (منفصلة عن ثقة اكتشاف الغرف نفسها) */
  overall_confidence: number;
  analyzed_at: string;
};

/** حد أدنى للثقة الإجمالية قبل اعتبار الهندسة كافية لبناء مشهد CAD حقيقي بدل التخطيطي */
export const GEOMETRY_CONFIDENCE_THRESHOLD = 0.45;

export function hasUsableGeometry(geometry: FloorGeometry | undefined): boolean {
  if (!geometry) return false;
  return geometry.walls.length > 0 && geometry.overall_confidence >= GEOMETRY_CONFIDENCE_THRESHOLD;
}

/** هندسة غرفة واحدة كافية للبناء الحقيقي (جدران محيطة بها + ثقة معقولة) — تُقيَّم لكل غرفة على حدة */
export function roomHasUsableGeometry(geometry: FloorGeometry | undefined, roomId: string): boolean {
  if (!geometry) return false;
  const room = geometry.rooms.find((r) => r.room_id === roomId);
  if (!room || room.polygon.length < 3) return false;
  return room.confidence >= GEOMETRY_CONFIDENCE_THRESHOLD;
}
