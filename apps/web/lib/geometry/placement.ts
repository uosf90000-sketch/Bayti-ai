import type { Vec2, WallSegment, Opening, RoomGeometry } from "./types";

/**
 * هندسة حساب بحتة (بلا Three.js/DOM) — قابلة للاختبار مباشرة. تُستخدم من
 * components/scene3d.tsx لبناء جدران حقيقية بفتحات فعلية، ووضع أثاث بلا تداخل
 * مع الجدران أو الفتحات (توجيه صريح: "منع تداخل العناصر مع الجدران أو الأبواب").
 */

export type BBox = { minX: number; maxX: number; minY: number; maxY: number };

export function polygonBBox(polygon: Vec2[]): BBox {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** الجدران التي يمر أحد طرفيها قرب حدود مضلّع الغرفة (هامش نسبي صغير) — تُعتبر جدران هذه الغرفة تحديدًا */
export function wallsForRoom(walls: WallSegment[], room: RoomGeometry, margin = 0.03): WallSegment[] {
  const box = polygonBBox(room.polygon);
  const inBox = (p: Vec2) =>
    p[0] >= box.minX - margin && p[0] <= box.maxX + margin && p[1] >= box.minY - margin && p[1] <= box.maxY + margin;
  return walls.filter((w) => inBox(w.from) || inBox(w.to));
}

export function openingsForWalls(openings: Opening[], walls: WallSegment[]): Opening[] {
  const wallIds = new Set(walls.map((w) => w.id));
  return openings.filter((o) => wallIds.has(o.wall_id));
}

/** يوجد نقطة الفتحة على طول الجدار كنسبة 0..1 من from إلى to (إسقاط أقرب نقطة على الخط) */
export function projectOntoWall(wall: WallSegment, point: Vec2): number {
  const [x1, y1] = wall.from;
  const [x2, y2] = wall.to;
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  const t = ((point[0] - x1) * dx + (point[1] - y1) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}

export type WallSpan = { startT: number; endT: number };

/**
 * يقسّم جدارًا إلى أجزاء صلبة (خارج نطاقات الفتحات) — فجوة حقيقية بمكان كل باب/نافذة
 * بدل جدار مصمت لا يعكس الفتحات المكتشفة فعليًا.
 */
export function splitWallByOpenings(wall: WallSegment, openings: Opening[], defaultWidthFraction = 0.08): WallSpan[] {
  const wallLen = dist(wall.from, wall.to);
  if (wallLen === 0) return [{ startT: 0, endT: 1 }];

  const gaps = openings
    .map((o) => {
      const t = projectOntoWall(wall, o.position);
      const halfWidthT = o.width_m != null ? o.width_m / 2 / wallLen : defaultWidthFraction / 2;
      return { start: Math.max(0, t - halfWidthT), end: Math.min(1, t + halfWidthT) };
    })
    .sort((a, b) => a.start - b.start);

  const spans: WallSpan[] = [];
  let cursor = 0;
  for (const gap of gaps) {
    if (gap.start > cursor) spans.push({ startT: cursor, endT: gap.start });
    cursor = Math.max(cursor, gap.end);
  }
  if (cursor < 1) spans.push({ startT: cursor, endT: 1 });
  return spans.filter((s) => s.endT - s.startT > 0.01);
}

export type PlacedFurniture = {
  center: Vec2; // نظام إحداثيات الغرفة (نفس نظام polygon)
  /** الدوران المطلوب حول المحور العمودي (Y في Three.js) — width/depth أدناه هي الأبعاد
   *  الأصلية غير المُدارة؛ يجب تدوير الشبكة (mesh) بهذه الزاوية، لا تبديل width/depth يدويًا */
  rotationDeg: number;
  width: number;
  depth: number;
};

type FurnitureCandidate = { width: number; depth: number; height: number };

const WALL_CLEARANCE = 0.04; // هامش عن خط الجدار (نظام إحداثيات نسبي بعد التحويل لأمتار عبر scaleMetersPerUnit)
const OPENING_CLEARANCE_M = 0.5; // مسافة أمان حول كل فتحة (سوينغ الباب) بالأمتار

function rectsOverlap(a: BBox, b: BBox): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

function bboxOfCenter(center: Vec2, w: number, d: number): BBox {
  return { minX: center[0] - w / 2, maxX: center[0] + w / 2, minY: center[1] - d / 2, maxY: center[1] + d / 2 };
}

function polygonCentroid(polygon: Vec2[]): Vec2 {
  let sx = 0, sy = 0;
  for (const [x, y] of polygon) { sx += x; sy += y; }
  return [sx / polygon.length, sy / polygon.length];
}

/**
 * يضع قطع الأثاث داخل حدود الغرفة (BBox المضلّع، تقريب معقول لغرف شبه مستطيلة)
 * مع تفادي مناطق الفتحات وتصادم القطع مع بعضها — لا يضع قطعة إن تعذّر إيجاد مكان صالح.
 */
export function placeFurniture(
  room: RoomGeometry,
  walls: WallSegment[],
  openings: Opening[],
  items: FurnitureCandidate[],
  metersPerUnit: number,
): PlacedFurniture[] {
  const box = polygonBBox(room.polygon);
  const clearanceUnits = WALL_CLEARANCE;
  const usable: BBox = {
    minX: box.minX + clearanceUnits, maxX: box.maxX - clearanceUnits,
    minY: box.minY + clearanceUnits, maxY: box.maxY - clearanceUnits,
  };
  if (usable.maxX <= usable.minX || usable.maxY <= usable.minY) return [];

  const openingClearanceUnits = OPENING_CLEARANCE_M / Math.max(metersPerUnit, 0.01);
  const openingZones: BBox[] = openings.map((o) => ({
    minX: o.position[0] - openingClearanceUnits, maxX: o.position[0] + openingClearanceUnits,
    minY: o.position[1] - openingClearanceUnits, maxY: o.position[1] + openingClearanceUnits,
  }));

  const placed: PlacedFurniture[] = [];
  const placedBoxes: BBox[] = [];

  const wallsSorted = [...walls].sort((a, b) => dist(b.from, b.to) - dist(a.from, a.to));
  const centroid = polygonCentroid(room.polygon);

  for (const item of items) {
    const wUnits = item.width / metersPerUnit;
    const dUnits = item.depth / metersPerUnit;
    let placedThis = false;

    // محاولة أولى: ضد أطول جدار غير مُستخدم بعد، مركّزًا على طوله (وضع واقعي للأثاث الكبير)
    for (const wall of wallsSorted) {
      const midX = (wall.from[0] + wall.to[0]) / 2;
      const midY = (wall.from[1] + wall.to[1]) / 2;
      const wallLen = dist(wall.from, wall.to);
      if (wallLen === 0) continue;

      // الاتجاه "للداخل" يُحسب من منتصف الجدار نحو مركز ثقل الغرفة — لا يعتمد على
      // اتجاه رسم الجدار (from→to) الذي لا يضمن أي التفاف موحّد حول الغرفة عند
      // استخراج الجدران بشكل مستقل من الرؤية الحاسوبية
      const toCentroidX = centroid[0] - midX;
      const toCentroidY = centroid[1] - midY;
      const toCentroidLen = Math.hypot(toCentroidX, toCentroidY) || 1;
      const inwardX = toCentroidX / toCentroidLen;
      const inwardY = toCentroidY / toCentroidLen;

      // هل الجدار أقرب للأفقي أم للعمودي؟ يحدد أي بُعد للأثاث (عرض/عمق) يوازي الجدار
      const dx = Math.abs(wall.to[0] - wall.from[0]);
      const dy = Math.abs(wall.to[1] - wall.from[1]);
      const isVertical = dy > dx;
      const boxW = isVertical ? dUnits : wUnits;
      const boxD = isVertical ? wUnits : dUnits;
      const wallAngleDeg = (Math.atan2(wall.to[1] - wall.from[1], wall.to[0] - wall.from[0]) * 180) / Math.PI;

      const offset = boxD / 2 + clearanceUnits;
      const center: Vec2 = [midX + inwardX * offset, midY + inwardY * offset];
      const candidateBox = bboxOfCenter(center, boxW, boxD);

      const withinRoom =
        candidateBox.minX >= usable.minX && candidateBox.maxX <= usable.maxX &&
        candidateBox.minY >= usable.minY && candidateBox.maxY <= usable.maxY;
      const hitsOpening = openingZones.some((z) => rectsOverlap(candidateBox, z));
      const hitsFurniture = placedBoxes.some((b) => rectsOverlap(candidateBox, b));

      if (withinRoom && !hitsOpening && !hitsFurniture) {
        placed.push({ center, rotationDeg: wallAngleDeg, width: item.width, depth: item.depth });
        placedBoxes.push(candidateBox);
        placedThis = true;
        break;
      }
    }
    if (placedThis) continue;

    // محاولة ثانية: بحث شبكي حر داخل الغرفة (لعناصر لم تجد مكانًا ضد جدار)
    const steps = 6;
    outer: for (let sx = 1; sx < steps; sx++) {
      for (let sy = 1; sy < steps; sy++) {
        const center: Vec2 = [
          usable.minX + ((usable.maxX - usable.minX) * sx) / steps,
          usable.minY + ((usable.maxY - usable.minY) * sy) / steps,
        ];
        const candidateBox = bboxOfCenter(center, wUnits, dUnits);
        const withinRoom =
          candidateBox.minX >= usable.minX && candidateBox.maxX <= usable.maxX &&
          candidateBox.minY >= usable.minY && candidateBox.maxY <= usable.maxY;
        const hitsOpening = openingZones.some((z) => rectsOverlap(candidateBox, z));
        const hitsFurniture = placedBoxes.some((b) => rectsOverlap(candidateBox, b));
        if (withinRoom && !hitsOpening && !hitsFurniture) {
          placed.push({ center, rotationDeg: 0, width: item.width, depth: item.depth });
          placedBoxes.push(candidateBox);
          placedThis = true;
          break outer;
        }
      }
    }
    // لم يُوجد مكان صالح لهذه القطعة — تُترك بلا وضع بدل تجاهل التصادم (لا اختلاق)
  }

  return placed;
}
