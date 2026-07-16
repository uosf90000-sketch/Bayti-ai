import type { AnalyzedTwin } from "../twin";
import type { ProjectPipeline } from "./types";

/**
 * بوابة "مكتمل" — لا تُعرض حالة اكتمال المشروع إلا إذا تحققت كل الشروط فعليًا
 * (توجيه صريح من المؤسس): نتيجة محفوظة مرتبطة بنفس project_id، لا بيانات Demo
 * متسربة (كل غرفة في النتيجة موجودة فعليًا في التوأم المكتشف)، عدد الغرف مطابق
 * تمامًا لعدد الغرف المكتشفة، وكل غرفة نجح توليد تصميمها فعليًا (لا أخطاء معلّقة).
 * التكلفة نفسها مضمونة الصدق بنيويًا من Cost Engine (لا مسار لرقم مُخترع).
 */
export function isPipelineComplete(twin: AnalyzedTwin | undefined, pipeline: ProjectPipeline | undefined): boolean {
  if (!twin || !pipeline) return false;
  if (pipeline.project_id !== twin.project_id) return false;
  if (pipeline.rooms.length !== twin.rooms.length) return false;

  const detectedRoomIds = new Set(twin.rooms.map((r) => r.id));
  if (!pipeline.rooms.every((r) => detectedRoomIds.has(r.room.id))) return false;
  if (!pipeline.rooms.every((r) => r.design !== null && r.error === null)) return false;

  return true;
}
