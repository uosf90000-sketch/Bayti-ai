import type { AnalyzedRoom } from "@/lib/twin";
import type { FloorGeometry, WallSegment, Opening, RoomGeometry, CoordinateScale, Vec2 } from "@/lib/geometry/types";

const EXT_MEDIA: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  dwg: "application/acad", dxf: "application/dxf",
};

async function fileToBase64(file: File): Promise<{ base64Data: string; mediaType: string }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mediaType = file.type || EXT_MEDIA[ext] || "application/octet-stream";
  return { base64Data: btoa(binary), mediaType };
}

/** غرفة كما يُرجعها /api/analysis — بيانات وصفية (تُحفظ في twinStore) + هندسة مكانية (تُحفظ في geometryStore) معًا */
export type ClientAnalyzedRoom = Omit<AnalyzedRoom, "id"> & {
  polygon: Vec2[] | null;
  orientation_deg: number | null;
  geometry_confidence: number;
};

export type ClientAnalysisResult = {
  rooms: ClientAnalyzedRoom[];
  overall_confidence: number;
  scale: CoordinateScale;
  walls: WallSegment[];
  openings: Opening[];
  geometry_overall_confidence: number;
};

/** يستدعي /api/analysis من المتصفح — لا مفتاح API مكشوف هنا، الاستدعاء الفعلي خادم فقط */
export async function analyzeFloorplanClient(file: File): Promise<ClientAnalysisResult> {
  const { base64Data, mediaType } = await fileToBase64(file);
  const res = await fetch("/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Data, mediaType }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "فشل تحليل المخطط");
  return json as ClientAnalysisResult;
}

/**
 * يقسّم نتيجة التحليل الخام إلى (أ) بيانات وصفية للتوأم البسيط و(ب) هندسة CAD
 * تقريبية — يُحفظان في مخزنين منفصلين (twinStore/geometryStore) لكن مرتبطين
 * بنفس معرّفات الغرف (room-0, room-1, ...) بترتيب واحد ثابت.
 */
export function splitAnalysisResult(result: ClientAnalysisResult, projectId: string): { rooms: AnalyzedRoom[]; geometry: FloorGeometry } {
  const roomIds = result.rooms.map((_, i) => `room-${i}`);
  const rooms = result.rooms.map((r, i) => ({
    id: roomIds[i]!, type: r.type, name_ar: r.name_ar, area_m2: r.area_m2, dimensions_m: r.dimensions_m, confidence: r.confidence,
  }));
  const geometryRooms: RoomGeometry[] = result.rooms
    .map((r, i): RoomGeometry | null =>
      r.polygon && r.polygon.length >= 3
        ? { room_id: roomIds[i]!, polygon: r.polygon, orientation_deg: r.orientation_deg, confidence: r.geometry_confidence }
        : null,
    )
    .filter((r): r is RoomGeometry => r !== null);

  const geometry: FloorGeometry = {
    project_id: projectId,
    scale: result.scale,
    walls: result.walls,
    openings: result.openings,
    rooms: geometryRooms,
    overall_confidence: result.geometry_overall_confidence,
    analyzed_at: new Date().toISOString(),
  };
  return { rooms, geometry };
}
