import type { ProjectPipeline, RoomCost, ProjectCost } from "./types";

/**
 * Cost Engine — حساب صرف، لا استدعاء شبكة. التكلفة تُجمع فقط من عناصر تسوق
 * مطابقة فعليًا بمنتج حقيقي وسعره — لا رقم مُخترع لعنصر غير مطابق (يبقى
 * "غير مسعّر" ويُحسب صراحة ضمن unpricedItemCount بدل تجاهله بصمت).
 */

export function costForRoom(pipeline: ProjectPipeline, roomId: string): RoomCost {
  const result = pipeline.rooms.find((r) => r.room.id === roomId);
  const shopping = result?.shopping ?? [];
  let matchedTotal = 0;
  let matchedCount = 0;
  let unmatchedCount = 0;
  for (const m of shopping) {
    if (m.matched && m.price != null) {
      matchedTotal += m.price;
      matchedCount += 1;
    } else {
      unmatchedCount += 1;
    }
  }
  return { room_id: roomId, matchedTotal, matchedCount, unmatchedCount };
}

export function computeProjectCost(pipeline: ProjectPipeline): ProjectCost {
  const byRoom = pipeline.rooms.map((r) => costForRoom(pipeline, r.room.id));
  const total = byRoom.reduce((s, r) => s + r.matchedTotal, 0);
  const unpricedItemCount = byRoom.reduce((s, r) => s + r.unmatchedCount, 0);

  const byCategory: Record<string, number> = {};
  for (const r of pipeline.rooms) {
    for (const m of r.shopping) {
      if (m.matched && m.price != null) {
        const cat = "category" in m.item ? m.item.category : m.item.category_ar;
        byCategory[cat] = (byCategory[cat] ?? 0) + m.price;
      }
    }
  }

  return { total, byRoom, byCategory, unpricedItemCount };
}
