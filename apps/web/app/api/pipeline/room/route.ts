import { NextResponse } from "next/server";
import { generateRoomDesign } from "@/lib/design/designEngine";
import { matchRoomDesignToShopping } from "@/lib/design/shoppingEngine";
import type { RoomObject } from "@/lib/design/types";

export const maxDuration = 60;

/**
 * خط الإنتاج الحقيقي لغرفة واحدة: توليد تصميم (Claude) ثم مطابقة تسوق (الكتالوج
 * الحقيقي) — خادم فقط. تُستدعى مرة لكل غرفة مكتشفة فعليًا (لا دمج، لا اختراع غرف).
 */
export async function POST(req: Request) {
  let body: { room?: RoomObject };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!body.room) {
    return NextResponse.json({ error: "بيانات الغرفة مفقودة" }, { status: 400 });
  }

  try {
    const design = await generateRoomDesign(body.room);
    const shopping = await matchRoomDesignToShopping(design);
    return NextResponse.json({ design, shopping });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل خط الإنتاج لهذه الغرفة";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
