import type { RoomType } from "@bayti/design-schema";
import type { AnalyzedRoom, AnalyzedTwin } from "./twin";
import { NAJRES_ROOMS, NAJRES_TOTALS, type RoomPreview } from "./mock";

/**
 * يربط نوع غرفة مكتشف فعليًا (من التحليل الحقيقي) بتصميم/منتجات جاهزة —
 * فقط للأنواع التي لدينا محتوى تصميم حقيقي لها. أي نوع مكتشف بلا تصميم جاهز
 * يُعرض ببطاقة عامة صادقة بدل تلفيق محتوى (P9) — ولا تُعرض أبدًا غرفة لم تُكتشف
 * فعليًا في التوأم الرقمي (يمنع تصميم 15 غرفة لمخطط من غرفتين فقط).
 */
const TYPE_TO_NAJRES_KEY: Partial<Record<RoomType, string>> = {
  majlis_men: "majlis",
  living: "living",
  kitchen: "kitchen",
  bedroom_master: "master",
  kids_room: "kids",
  dining: "dining",
  muqallat: "dining",
};

export type ResolvedRoom =
  | { matched: true; detected: AnalyzedRoom; template: RoomPreview }
  | { matched: false; detected: AnalyzedRoom };

export function resolveRooms(twin: AnalyzedTwin | undefined): ResolvedRoom[] {
  if (!twin) return [];
  return twin.rooms.map((detected) => {
    const najresKey = TYPE_TO_NAJRES_KEY[detected.type];
    const template = najresKey ? NAJRES_ROOMS.find((r) => r.key === najresKey) : undefined;
    return template ? { matched: true, detected, template } : { matched: false, detected };
  });
}

export function matchedTemplates(resolved: ResolvedRoom[]): RoomPreview[] {
  return resolved
    .filter((r): r is Extract<ResolvedRoom, { matched: true }> => r.matched)
    .map((r) => r.template);
}

export function totalsFor(resolved: ResolvedRoom[]) {
  const items = matchedTemplates(resolved).reduce((s, r) => s + r.items, 0);
  return { rooms: resolved.length, itemCount: items, budget: NAJRES_TOTALS.budget, health: NAJRES_TOTALS.health };
}
