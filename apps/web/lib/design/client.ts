import type { RoomObject, RoomDesign, ShoppingMatch } from "./types";

/** يستدعي /api/pipeline/room من المتصفح — لا مفتاح API مكشوف، الاستدعاء الفعلي خادم فقط */
export async function runRoomPipeline(room: RoomObject): Promise<{ design: RoomDesign; shopping: ShoppingMatch[] } | { error: string }> {
  try {
    const res = await fetch("/api/pipeline/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room }),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.error ?? "فشل خط الإنتاج لهذه الغرفة" };
    return json;
  } catch {
    return { error: "تعذّر الاتصال بخط الإنتاج" };
  }
}
