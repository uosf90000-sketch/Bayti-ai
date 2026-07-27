import type { AnalyzedRoom, AnalyzedTwin } from "../twin";
import type { RoomObject } from "./types";

/** يحوّل غرفة مكتشفة في التوأم الرقمي إلى Room Object مستقل — نفس البيانات، حدود واضحة بين الوحدتين */
export function toRoomObject(r: AnalyzedRoom): RoomObject {
  return {
    id: r.id, type: r.type, name_ar: r.name_ar, area_m2: r.area_m2,
    dimensions_m: r.dimensions_m, confidence: r.confidence,
  };
}

/** كل الغرف المستقلة لمشروع — بالضبط عدد الغرف المكتشفة، لا أكثر ولا أقل (لا دمج، لا اختراع) */
export function roomObjectsFromTwin(twin: AnalyzedTwin): RoomObject[] {
  return twin.rooms.map(toRoomObject);
}
