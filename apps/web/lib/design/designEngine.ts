import { z } from "zod";
import type { RoomObject, RoomDesign } from "./types";
import { getAnthropicClient, classifyAnthropicError, logAiCall } from "../ai/client";

/**
 * Design Engine — خادم فقط. يولّد تصميمًا حقيقيًا لغرفة واحدة عبر Claude:
 * لوحة ألوان + مواد + أثاث + إضاءة. هذا اقتراح توليدي احترافي (وصف نصي/قوائم)،
 * وليس AgentProposal مجمَّدًا بأدلة formula_ref قابلة لإعادة التشغيل (راجع
 * docs/DESIGN_PIPELINE.md لقرار النطاق). لا مسار بديل عند الفشل — خطأ واضح فقط.
 */

const PaletteEntrySchema = z.object({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/), role_ar: z.string().min(1), name_ar: z.string().min(1) });
const MaterialSchema = z.object({ category_ar: z.string().min(1), name_ar: z.string().min(1), description_ar: z.string().min(1) });
/** فئات مقيَّدة تطابق فئات الكتالوج الحقيقي (packages/catalog-data) — تُبقي مطابقة التسوق دقيقة بدل تخمين نصي حر */
export const CATALOG_CATEGORIES = [
  "sofas", "armchairs", "outdoor-seating", "coffee-tables", "lighting", "curtains",
  "bedroom", "storage", "mattresses", "tv-media", "dining", "mirrors",
  "home office", "home decor", "soft furnishings", "other",
] as const;
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

const FurnitureSchema = z.object({ name_ar: z.string().min(1), category: z.enum(CATALOG_CATEGORIES), qty: z.number().int().positive(), spec_ar: z.string().min(1) });
const LightingSchema = z.object({ name_ar: z.string().min(1), type_ar: z.string().min(1), qty: z.number().int().positive(), notes_ar: z.string().min(1) });

const RoomDesignSchema = z.object({
  style_ar: z.string().min(1),
  summary_ar: z.string().min(1),
  palette: z.array(PaletteEntrySchema).min(1),
  materials: z.array(MaterialSchema).min(1),
  furniture: z.array(FurnitureSchema).min(1),
  lighting: z.array(LightingSchema).min(1),
  confidence: z.number().min(0).max(1),
});

const SYSTEM_PROMPT = `أنت كبير المصممين الداخليين في مجلس بيتي AI لمنزل سعودي/خليجي حقيقي.
مهمتك: اقتراح تصميم كامل لغرفة واحدة بعينها فقط — بلا افتراض غرف أخرى، بلا تكرار محتوى عام.

قواعد صارمة:
- صمّم لهذه الغرفة فقط بنوعها ومساحتها المعطاة — لا تفترض غرفًا أخرى ولا تدمج وظائف غرف مختلفة.
- كل عنصر أثاث/إضاءة يجب أن يكون واقعيًا لحجم الغرفة المعطى (إن وُجدت مساحة) — لا تقترح أثاثًا لا يتسع في المساحة المذكورة.
- الألوان بصيغة hex سداسية صحيحة فقط.
- category لكل قطعة أثاث يجب أن تكون واحدة فقط من هذه القائمة الثابتة: ${CATALOG_CATEGORIES.join(", ")}. اختر الأقرب حتى لو لم تكن مطابقة تمامًا — لا فئة حرة خارج هذه القائمة.
- confidence يعكس ثقتك الحقيقية في ملاءمة هذا الاقتراح لنوع الغرفة ومساحتها، لا رقمًا ثابتًا.
- استخدم أداة propose_room_design فقط — لا نص حر خارجها.
- هذا اقتراح تصميم إبداعي وليس حسابًا هندسيًا دقيقًا — لا تدّعِ قياسات مليمترية مؤكدة.`;

function roomContext(room: RoomObject): string {
  const parts = [`نوع الغرفة: ${room.type}`, `الاسم: ${room.name_ar}`];
  parts.push(room.area_m2 != null ? `المساحة المكتشفة: ${room.area_m2} م²` : `المساحة: غير مؤكدة من المخطط`);
  if (room.dimensions_m && (room.dimensions_m.width || room.dimensions_m.length)) {
    parts.push(`الأبعاد المكتشفة: ${room.dimensions_m.width ?? "؟"}×${room.dimensions_m.length ?? "؟"} م`);
  }
  parts.push(`ثقة اكتشاف الغرفة نفسها: ${Math.round(room.confidence * 100)}%`);
  return parts.join(" — ");
}

export async function generateRoomDesign(room: RoomObject): Promise<RoomDesign> {
  const started = Date.now();
  try {
    const client = await getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "propose_room_design",
          description: "اقتراح تصميم كامل لغرفة واحدة: أسلوب، لوحة ألوان، مواد، أثاث، إضاءة",
          input_schema: {
            type: "object",
            properties: {
              style_ar: { type: "string" },
              summary_ar: { type: "string" },
              palette: {
                type: "array",
                items: { type: "object", properties: { hex: { type: "string" }, role_ar: { type: "string" }, name_ar: { type: "string" } }, required: ["hex", "role_ar", "name_ar"] },
              },
              materials: {
                type: "array",
                items: { type: "object", properties: { category_ar: { type: "string" }, name_ar: { type: "string" }, description_ar: { type: "string" } }, required: ["category_ar", "name_ar", "description_ar"] },
              },
              furniture: {
                type: "array",
                items: { type: "object", properties: { name_ar: { type: "string" }, category: { type: "string", enum: CATALOG_CATEGORIES as unknown as string[] }, qty: { type: "integer" }, spec_ar: { type: "string" } }, required: ["name_ar", "category", "qty", "spec_ar"] },
              },
              lighting: {
                type: "array",
                items: { type: "object", properties: { name_ar: { type: "string" }, type_ar: { type: "string" }, qty: { type: "integer" }, notes_ar: { type: "string" } }, required: ["name_ar", "type_ar", "qty", "notes_ar"] },
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["style_ar", "summary_ar", "palette", "materials", "furniture", "lighting", "confidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "propose_room_design" },
      messages: [
        { role: "user", content: `صمّم هذه الغرفة فقط باستخدام أداة propose_room_design: ${roomContext(room)}` },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("generateRoomDesign: لم يُرجع النموذج نتيجة أداة صالحة — فشل التوليد، لا نتيجة بديلة.");
    }
    const parsed = RoomDesignSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new Error(`generateRoomDesign: نتيجة التصميم لا تطابق العقد المطلوب — ${parsed.error.message}`);
    }
    logAiCall({ op: "generateRoomDesign", status: "ok", durationMs: Date.now() - started });
    return { room_id: room.id, ...parsed.data };
  } catch (e) {
    logAiCall({ op: "generateRoomDesign", status: "error", durationMs: Date.now() - started, errorClass: e instanceof Error ? e.constructor.name : "unknown" });
    if (e instanceof Error && e.message.startsWith("generateRoomDesign:")) throw e;
    throw await classifyAnthropicError(e, "generateRoomDesign");
  }
}
