import { z } from "zod";
import { RoomType } from "@bayti/design-schema";

/**
 * تحليل مخطط حقيقي عبر رؤية Claude — لا بيانات ثابتة، لا Demo (توجيه المؤسس).
 * صادق بحدوده: يستخرج عدد الغرف ونوعها وثقة الاكتشاف من صورة/PDF فعلي — لا يخترع
 * جدرانًا أو إحداثيات دقيقة (ذلك يحتاج مسح CAD حقيقي، خارج نطاق هذه الشريحة).
 * ملفات CAD (DWG/DXF) ليست صورًا قابلة للتحليل هنا — تُرفض بوضوح بدل التخمين.
 */

const AnalyzedRoomSchema = z.object({
  type: RoomType,
  name_ar: z.string().min(1),
  area_m2: z.number().positive().nullable(),
  confidence: z.number().min(0).max(1),
});

const AnalysisResultSchema = z.object({
  rooms: z.array(AnalyzedRoomSchema).min(1),
  overall_confidence: z.number().min(0).max(1),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const SUPPORTED_DOC_TYPES = ["application/pdf"];

const ROOM_TYPES_LIST = RoomType.options.join(", ");

const SYSTEM_PROMPT = `أنت مهندس معماري تحلّل مخططات منازل سعودية/خليجية حقيقية. مهمتك الوحيدة: عدّ الغرف الفعلية الظاهرة في المخطط وتصنيف نوع كل غرفة.

قواعد صارمة:
- عدّ فقط الغرف الظاهرة فعليًا في هذا المخطط بالذات — لا تفترض غرفًا غير مرسومة.
- لكل غرفة اختر نوعًا واحدًا فقط من هذه القائمة الثابتة: ${ROOM_TYPES_LIST}. إن لم تتأكد من النوع استخدم "unknown" ولا تخمّن.
- المساحة (area_m2): فقط إن كانت مكتوبة صراحة على المخطط أو قابلة للاستنتاج بثقة من مقياس مرسوم — وإلا اجعلها null. لا تقدّر مساحة بلا سند.
- confidence لكل غرفة: رقم بين 0 و1 يعكس ثقتك الحقيقية في نوع الغرفة، لا رقمًا ثابتًا.
- overall_confidence: ثقتك الإجمالية في قراءة المخطط ككل (جودة الصورة، وضوح الخطوط، اكتمال المخطط).
- استخدم أداة report_rooms فقط — لا نص حر خارجها.`;

function assertSupported(mediaType: string): "image" | "document" {
  if (SUPPORTED_IMAGE_TYPES.includes(mediaType)) return "image";
  if (SUPPORTED_DOC_TYPES.includes(mediaType)) return "document";
  throw new Error(
    `analyzeFloorplan: نوع الملف "${mediaType}" غير مدعوم للتحليل المباشر — ملفات CAD (DWG/DXF) تحتاج معالجة منفصلة غير مبنية بعد. ارفع صورة أو PDF من المخطط.`,
  );
}

export async function analyzeFloorplan(base64Data: string, mediaType: string): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("analyzeFloorplan: ANTHROPIC_API_KEY غير مضبوط — لا يمكن تشغيل تحليل حقيقي بدونه.");
  }
  const kind = assertSupported(mediaType);
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const content: Array<Record<string, unknown>> =
    kind === "image"
      ? [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } }]
      : [{ type: "document", source: { type: "base64", media_type: mediaType, data: base64Data } }];

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "report_rooms",
        description: "الإبلاغ عن الغرف المكتشفة في المخطط مع نوع كل غرفة ومساحتها وثقة الاكتشاف",
        input_schema: {
          type: "object",
          properties: {
            rooms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: RoomType.options },
                  name_ar: { type: "string" },
                  area_m2: { type: ["number", "null"] },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                },
                required: ["type", "name_ar", "area_m2", "confidence"],
              },
            },
            overall_confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["rooms", "overall_confidence"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "report_rooms" },
    messages: [
      {
        role: "user",
        content: [
          ...content,
          { type: "text", text: "حلّل هذا المخطط باستخدام أداة report_rooms فقط، وفق القواعد المذكورة في تعليمات النظام." },
        ] as never,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("analyzeFloorplan: لم يُرجع النموذج نتيجة أداة صالحة — فشل التحليل، لا نتيجة بديلة.");
  }

  const parsed = AnalysisResultSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`analyzeFloorplan: نتيجة التحليل لا تطابق العقد المطلوب — ${parsed.error.message}`);
  }
  return parsed.data;
}
