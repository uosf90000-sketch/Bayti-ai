import { NextResponse } from "next/server";
import { analyzeFloorplan } from "@/lib/vision/analyzeFloorplan";

export const maxDuration = 60;

/** خادم فقط — يستخدم ANTHROPIC_API_KEY، لا يجوز استدعاؤه من متصفح مباشرة بمفتاح مكشوف */
export async function POST(req: Request) {
  let body: { base64Data?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  if (!body.base64Data || !body.mediaType) {
    return NextResponse.json({ error: "الملف أو نوعه مفقود" }, { status: 400 });
  }

  try {
    const result = await analyzeFloorplan(body.base64Data, body.mediaType);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل تحليل المخطط";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
