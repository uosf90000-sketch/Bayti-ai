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
 * مكتوب على المخطط، يُستخدم مباشرة. وإلا، يُعاير من مساحة حقيقية معروفة لهذه
 * الغرفة — إما area_m2 مباشرة، أو محسوبة من dimensions_m (عرض×طول) إن كانا
 * مكتوبين صراحة على المخطط لكن لم تُحسب مساحة منهما صراحة (نفس بيانات العمل
 * الحقيقية، فقط ضرب بسيط، لا اختلاق) — عبر معادلة المساحة:
 * S = sqrt(area_m2 / normalized_area). بلا أيٍّ من الاثنين، لا يوجد مقياس
 * موثوق — ترجع undefined (يجب عندها الرجوع للعرض التخطيطي، لا اختلاق مقياس).
 */
export function metersPerUnitForRoom(
  geometry: FloorGeometry,
  roomGeom: RoomGeometry,
  areaM2: number | null,
  dimensionsM?: { width: number | null; length: number | null } | null,
): number | undefined {
  if (geometry.scale.status === "confirmed" && geometry.scale.meters_per_unit != null) {
    return geometry.scale.meters_per_unit;
  }
  const resolvedArea = areaM2 ?? (dimensionsM?.width != null && dimensionsM?.length != null ? dimensionsM.width * dimensionsM.length : null);
  if (resolvedArea != null && resolvedArea > 0 && roomGeom.polygon.length >= 3) {
    const normalizedArea = polygonArea(roomGeom.polygon);
    if (normalizedArea > 1e-6) {
      return Math.sqrt(resolvedArea / normalizedArea);
    }
  }
  return undefined;
}
