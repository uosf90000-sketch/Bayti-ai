import type { ProjectPipeline, RoomCost, ProjectCost } from "./types";

/**
 * Cost Engine — حساب صرف، لا استدعاء شبكة. التكلفة تُجمع فقط من عناصر تسوق
 * مطابقة فعليًا بمنتج حقيقي وسعره — لا رقم مُخترع لعنصر غير مطابق أو بلا سعر
 * مؤكد (يبقى "غير مسعّر" ويُحسب صراحة ضمن unpricedItemCount بدل تجاهله بصمت).
 * "لا يوجد منتج مطابق" و"منتج مطابق بلا سعر" حالتان مختلفتان تُحسبان بشكل منفصل.
 */

export function costForRoom(pipeline: ProjectPipeline, roomId: string): RoomCost {
  const result = pipeline.rooms.find((r) => r.room.id === roomId);
  const shopping = result?.shopping ?? [];
  let matchedTotal = 0;
  let pricedCount = 0;
  let matchedUnpricedCount = 0;
  let noMatchCount = 0;
  for (const m of shopping) {
    if (!m.matched) {
      noMatchCount += 1;
    } else if (m.price != null) {
      matchedTotal += m.price;
      pricedCount += 1;
    } else {
      matchedUnpricedCount += 1;
    }
  }
  return { room_id: roomId, matchedTotal, pricedCount, matchedUnpricedCount, noMatchCount };
}

export function computeProjectCost(pipeline: ProjectPipeline): ProjectCost {
  const byRoom = pipeline.rooms.map((r) => costForRoom(pipeline, r.room.id));
  const total = byRoom.reduce((s, r) => s + r.matchedTotal, 0);
  const unpricedItemCount = byRoom.reduce((s, r) => s + r.matchedUnpricedCount + r.noMatchCount, 0);

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
