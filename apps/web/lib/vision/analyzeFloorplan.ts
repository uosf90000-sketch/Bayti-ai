import { z } from "zod";
import { RoomType } from "@bayti/design-schema";
import { getAnthropicClient, classifyAnthropicError, logAiCall } from "../ai/client";

/**
 * تحليل مخطط حقيقي عبر رؤية Claude — لا بيانات ثابتة، لا Demo (توجيه المؤسس).
 * صادق بحدوده: يستخرج عدد الغرف ونوعها وثقة الاكتشاف، بالإضافة إلى هندسة تقريبية
 * (جدران/فتحات/حدود غرف) من صورة/PDF فعلي — نظام إحداثيات نسبي لأبعاد الصورة
 * (0..1) ما لم يُعثر على نص مقياس/بُعد مكتوب صراحة (عندها scale.status="confirmed").
 * هذا ليس مسح CAD دقيقًا — قرار نطاق موثّق في docs/CAD_ENGINE.md.
 * ملفات CAD (DWG/DXF) ليست صورًا قابلة للتحليل هنا — تُرفض بوضوح بدل التخمين.
 */

const DimensionsSchema = z.object({
  width: z.number().positive().nullable(),
  length: z.number().positive().nullable(),
  height: z.number().positive().nullable(),
}).nullable();

const Vec2Schema = z.tuple([z.number(), z.number()]);

const AnalyzedRoomSchema = z.object({
  type: RoomType,
  name_ar: z.string().min(1),
  area_m2: z.number().positive().nullable(),
  dimensions_m: DimensionsSchema,
  confidence: z.number().min(0).max(1),
  /** حدود الغرفة التقريبية (نظام إحداثيات نسبي 0..1) — null إن تعذّر تحديدها بثقة */
  polygon: z.array(Vec2Schema).min(3).nullable(),
  orientation_deg: z.number().nullable(),
  geometry_confidence: z.number().min(0).max(1),
});

const WallSchema = z.object({
  id: z.string(),
  from: Vec2Schema,
  to: Vec2Schema,
  thickness_m: z.number().positive().nullable(),
  height_m: z.number().positive().nullable(),
  kind: z.enum(["exterior", "interior", "unknown"]),
  confidence: z.number().min(0).max(1),
});

const OpeningSchema = z.object({
  id: z.string(),
  wall_id: z.string(),
  type: z.enum(["door", "window"]),
  position: Vec2Schema,
  width_m: z.number().positive().nullable(),
  confidence: z.number().min(0).max(1),
});

const ScaleSchema = z.object({
  status: z.enum(["confirmed", "unconfirmed"]),
  meters_per_unit: z.number().positive().nullable(),
  source: z.enum(["written_dims", "scale_text", "missing"]),
});

const AnalysisResultSchema = z.object({
  rooms: z.array(AnalyzedRoomSchema).min(1),
  overall_confidence: z.number().min(0).max(1),
  scale: ScaleSchema,
  walls: z.array(WallSchema),
  openings: z.array(OpeningSchema),
  geometry_overall_confidence: z.number().min(0).max(1),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const SUPPORTED_DOC_TYPES = ["application/pdf"];

const ROOM_TYPES_LIST = RoomType.options.join(", ");

const SYSTEM_PROMPT = `أنت مهندس معماري تحلّل مخططات منازل سعودية/خليجية حقيقية. مهمتك: عدّ الغرف الفعلية وتصنيف نوع كل غرفة، ثم استخراج هندسة تقريبية (جدران، فتحات، حدود كل غرفة) من نفس المخطط.

قواعد صارمة — تصنيف الغرف:
- عدّ فقط الغرف الظاهرة فعليًا في هذا المخطط بالذات — لا تفترض غرفًا غير مرسومة.
- لكل غرفة اختر نوعًا واحدًا فقط من هذه القائمة الثابتة: ${ROOM_TYPES_LIST}. إن لم تتأكد من النوع استخدم "unknown" ولا تخمّن.
- المساحة (area_m2) والأبعاد (dimensions_m): فقط إن كانت مكتوبة صراحة أو قابلة للاستنتاج بثقة من مقياس مرسوم — وإلا null.
- confidence لكل غرفة: ثقتك الحقيقية في نوع الغرفة، لا رقمًا ثابتًا.
- overall_confidence: ثقتك الإجمالية في قراءة المخطط ككل.

قواعد صارمة — الهندسة (جدران/فتحات/حدود):
- نظام الإحداثيات: نسبي لأبعاد الصورة كاملة — (0,0) الزاوية العلوية اليسرى، (1,1) الزاوية السفلية اليمنى. لا تستخدم أمتارًا للإحداثيات نفسها.
- scale: اجعل status="confirmed" فقط إن وجدت نصًا صريحًا لمقياس رسم (مثل 1:100) أو بُعدًا مكتوبًا يمكن ربطه بمسافة في الصورة — واحسب meters_per_unit وفق ذلك. غير ذلك اجعلها status="unconfirmed", meters_per_unit=null, source="missing".
- walls: ارسم فقط الجدران التي تراها فعليًا كخطوط واضحة في المخطط — from/to بإحداثيات نسبية لمركز الخط. thickness_m/height_m فقط إن وُجد سند رقمي حقيقي (نص/مقياس)، وإلا null. kind="exterior" للجدران الخارجية الواضحة، "interior" للداخلية، "unknown" إن لم تتأكد.
- openings: كل باب/نافذة واضح في المخطط، برقم wall_id يشير لجدار من القائمة أعلاه. width_m فقط بسند حقيقي.
- polygon لكل غرفة: حدود الغرفة التقريبية كنقاط متتالية (3 فأكثر) بنفس نظام الإحداثيات النسبي — استنتجها من الجدران المحيطة الظاهرة فعليًا.
- **هام جدًا — لا تكن متحفظًا أكثر من اللازم**: هذا مخطط معماري هندسي حقيقي (خطوط CAD مستقيمة، غرف مستطيلة أو شبه مستطيلة بجدران مزدوجة واضحة) في أغلب الحالات — وليس رسمًا يدويًا تقريبيًا. إن كانت حدود الغرفة (الجدران الأربعة المحيطة بها) مرئية بوضوح كخطوط مستقيمة حتى لو ازدحم المخطط بنصوص/أبعاد/غرف متعددة حوله، **ارسم polygon فعليًا واجعل geometry_confidence مرتفعة (0.6 فأكثر)** — لا تمتنع عن الرسم بسبب ازدحام المخطط أو وجود وحدات سكنية متعددة في نفس الصفحة. الامتناع (polygon=null) يجب أن يكون فقط للحالات الفعلية الغامضة: جدار غير واضح المسار، غرفة بلا حدود مرسومة، أو رسم يدوي تقريبي بلا خطوط مستقيمة حقيقية.
- إن لم تستطع تحديد حدود الغرفة بثقة معقولة فعلًا (لا بسبب حذر مفرط) اجعل polygon=null ولا تخترعه.
- orientation_deg لكل غرفة: فقط إن كان اتجاه الشمال مبينًا في المخطط (سهم شمال، بوصلة) ويمكن ربطه بالغرفة بثقة — وإلا null.
- geometry_confidence لكل غرفة: ثقتك في دقة حدودها المكانية (منفصلة عن ثقة نوعها) — لغرفة بجدران CAD واضحة هذا يجب أن يكون مرتفعًا (0.6+) حتى لو كانت الأبعاد الدقيقة غير مؤكدة، طالما الشكل العام للحدود واضح.
- geometry_overall_confidence: ثقتك الإجمالية في جودة استخراج الهندسة الكاملة (وضوح خطوط الجدران، اكتمالها). إن كان المخطط رديء الجودة أو رسمًا يدويًا تقريبيًا بلا خطوط واضحة فعلًا، أعد walls/openings فارغة و polygon=null لكل الغرف و geometry_overall_confidence منخفضة صراحة (أقل من 0.3) — لا تخترع هندسة وهمية لمجرد ملء الحقول. لكن لمخطط CAD هندسي واضح (كخطوط مستقيمة مزدوجة نموذجية) هذا يجب أن يكون مرتفعًا (0.6+) حتى مع ازدحام النص/الأبعاد حوله.

قواعد أخرى:
- إن كان الملف PDF متعدد الصفحات: ركّز فقط على الصفحة/الصفحات التي تُظهر فعليًا مخطط الغرف. إن وُجد أكثر من طابق في صفحات منفصلة، اجمع غرف كل الطوابق كغرف مستقلة — لا تُكرر نفس الغرفة لكل صفحة.
- إن كانت الصورة غير واضحة: أعد أفضل قراءة ممكنة مع confidence منخفض صريح بدل رفض الاستجابة.
- استخدم أداة report_rooms فقط — لا نص حر خارجها.`;

function assertSupported(mediaType: string): "image" | "document" {
  if (SUPPORTED_IMAGE_TYPES.includes(mediaType)) return "image";
  if (SUPPORTED_DOC_TYPES.includes(mediaType)) return "document";
  throw new Error(
    `analyzeFloorplan: نوع الملف "${mediaType}" غير مدعوم للتحليل المباشر — ملفات CAD (DWG/DXF) تحتاج معالجة منفصلة غير مبنية بعد. ارفع صورة أو PDF من المخطط.`,
  );
}

const vec2Schema = { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 } as const;

export async function analyzeFloorplan(base64Data: string, mediaType: string): Promise<AnalysisResult> {
  const kind = assertSupported(mediaType);
  const started = Date.now();
  try {
    const client = await getAnthropicClient();

    const content: Array<Record<string, unknown>> =
      kind === "image"
        ? [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } }]
        : [{ type: "document", source: { type: "base64", media_type: mediaType, data: base64Data } }];

    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "report_rooms",
          description: "الإبلاغ عن الغرف المكتشفة في المخطط مع نوعها وهندستها التقريبية (جدران وفتحات وحدود كل غرفة)",
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
                    dimensions_m: {
                      type: ["object", "null"],
                      properties: {
                        width: { type: ["number", "null"] },
                        length: { type: ["number", "null"] },
                        height: { type: ["number", "null"] },
                      },
                      required: ["width", "length", "height"],
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    polygon: { type: ["array", "null"], items: vec2Schema, minItems: 3 },
                    orientation_deg: { type: ["number", "null"] },
                    geometry_confidence: { type: "number", minimum: 0, maximum: 1 },
                  },
                  required: ["type", "name_ar", "area_m2", "dimensions_m", "confidence", "polygon", "orientation_deg", "geometry_confidence"],
                },
              },
              overall_confidence: { type: "number", minimum: 0, maximum: 1 },
              scale: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["confirmed", "unconfirmed"] },
                  meters_per_unit: { type: ["number", "null"] },
                  source: { type: "string", enum: ["written_dims", "scale_text", "missing"] },
                },
                required: ["status", "meters_per_unit", "source"],
              },
              walls: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    from: vec2Schema,
                    to: vec2Schema,
                    thickness_m: { type: ["number", "null"] },
                    height_m: { type: ["number", "null"] },
                    kind: { type: "string", enum: ["exterior", "interior", "unknown"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                  },
                  required: ["id", "from", "to", "thickness_m", "height_m", "kind", "confidence"],
                },
              },
              openings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    wall_id: { type: "string" },
                    type: { type: "string", enum: ["door", "window"] },
                    position: vec2Schema,
                    width_m: { type: ["number", "null"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                  },
                  required: ["id", "wall_id", "type", "position", "width_m", "confidence"],
                },
              },
              geometry_overall_confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["rooms", "overall_confidence", "scale", "walls", "openings", "geometry_overall_confidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "report_rooms" },
      messages: [
        {
          role: "user",
          content: [
            ...content,
            { type: "text", text: "حلّل هذا المخطط باستخدام أداة report_rooms فقط، وفق القواعد المذكورة في تعليمات النظام — الغرف وهندستها التقريبية معًا." },
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
    logAiCall({ op: "analyzeFloorplan", status: "ok", durationMs: Date.now() - started });
    return parsed.data;
  } catch (e) {
    logAiCall({ op: "analyzeFloorplan", status: "error", durationMs: Date.now() - started, errorClass: e instanceof Error ? e.constructor.name : "unknown" });
    if (e instanceof Error && e.message.startsWith("analyzeFloorplan:")) throw e;
    throw await classifyAnthropicError(e, "analyzeFloorplan");
  }
}
