import type { AnalyzedRoom } from "@/lib/twin";

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

export type ClientAnalysisResult = { rooms: Omit<AnalyzedRoom, "id">[]; overall_confidence: number };

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
