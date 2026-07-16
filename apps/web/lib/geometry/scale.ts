import type { FloorGeometry, RoomGeometry, Vec2 } from "./types";

/** مساحة مضلّع بصيغة Shoelace (بوحدات الإحداثي النسبي المربّعة) */
function polygonArea(polygon: Vec2[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/**
 * أمتار لكل وحدة إحداثي نسبي لغرفة بعينها. إن كان المقياس "confirmed" من نص
 * مكتوب على المخطط، يُستخدم مباشرة. وإلا، يُعاير من area_m2 المعروفة فعليًا
 * لهذه الغرفة (بيانات عمل حقيقية من التحليل نفسه) عبر معادلة المساحة:
 * S = sqrt(area_m2 / normalized_area). بلا أيٍّ من الاثنين، لا يوجد مقياس
 * موثوق — ترجع undefined (يجب عندها الرجوع للعرض التخطيطي، لا اختلاق مقياس).
 */
export function metersPerUnitForRoom(
  geometry: FloorGeometry,
  roomGeom: RoomGeometry,
  areaM2: number | null,
): number | undefined {
  if (geometry.scale.status === "confirmed" && geometry.scale.meters_per_unit != null) {
    return geometry.scale.meters_per_unit;
  }
  if (areaM2 != null && areaM2 > 0 && roomGeom.polygon.length >= 3) {
    const normalizedArea = polygonArea(roomGeom.polygon);
    if (normalizedArea > 1e-6) {
      return Math.sqrt(areaM2 / normalizedArea);
    }
  }
  return undefined;
}
