/**
 * عميل Anthropic موحّد — خادم فقط (يُستدعى فقط من lib/vision/analyzeFloorplan.ts
 * و lib/design/designEngine.ts، كلاهما خلف Route Handlers). Timeout + retry
 * محدودان مضبوطان صراحة (وليسا الافتراضي الصامت)، تصنيف أخطاء عربي واضح لكل
 * فئة فشل حقيقية من SDK، وlogging بلا بيانات حساسة — لا صور، لا نص مولَّد،
 * لا مفتاح API، فقط بيانات تشغيلية (نوع العملية، الحالة، المدة).
 */

const TIMEOUT_MS = 45_000; // مهلة استدعاء واحد — يشمل إعادة المحاولات الداخلية لـ SDK
const MAX_RETRIES = 2; // SDK يعيد المحاولة فقط على أخطاء قابلة للتكرار (429/5xx/انقطاع اتصال) — ليس على 4xx

export async function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY غير مضبوط — لا يمكن تشغيل استدعاء ذكاء اصطناعي حقيقي بدونه.");
  }
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: MAX_RETRIES });
}

/** يحوّل خطأ SDK الفعلي إلى رسالة عربية واضحة حسب فئة الفشل الحقيقية — لا تخمين */
export async function classifyAnthropicError(e: unknown, contextAr: string): Promise<Error> {
  const {
    APIConnectionTimeoutError, APIConnectionError, RateLimitError,
    AuthenticationError, PermissionDeniedError, InternalServerError, BadRequestError,
  } = await import("@anthropic-ai/sdk");

  if (e instanceof APIConnectionTimeoutError) {
    return new Error(`${contextAr}: انتهت مهلة الاتصال بالذكاء الاصطناعي (${TIMEOUT_MS / 1000} ثانية) — حاول مجددًا.`);
  }
  if (e instanceof RateLimitError) {
    return new Error(`${contextAr}: تجاوزنا حد الطلبات المسموح مؤقتًا — حاول بعد قليل.`);
  }
  if (e instanceof AuthenticationError || e instanceof PermissionDeniedError) {
    return new Error(`${contextAr}: مفتاح ANTHROPIC_API_KEY غير صالح أو غير مصرَّح له.`);
  }
  if (e instanceof InternalServerError) {
    return new Error(`${contextAr}: خدمة الذكاء الاصطناعي غير متاحة مؤقتًا من طرفها — حاول مجددًا لاحقًا.`);
  }
  if (e instanceof APIConnectionError) {
    return new Error(`${contextAr}: تعذّر الاتصال بخدمة الذكاء الاصطناعي — تحقق من الشبكة وحاول مجددًا.`);
  }
  if (e instanceof BadRequestError) {
    return new Error(`${contextAr}: طلب غير صالح للذكاء الاصطناعي (${e.message}).`);
  }
  return new Error(`${contextAr}: ${e instanceof Error ? e.message : "خطأ غير متوقع"}`);
}

/** سجل تشغيلي بلا بيانات حساسة — لا صورة/PDF مُرسلة، لا نص مولَّد، لا مفتاح، فقط ميتاداتا */
export function logAiCall(event: { op: string; status: "ok" | "error"; durationMs: number; errorClass?: string }) {
  console.log(JSON.stringify({ scope: "ai-call", ...event, at: new Date().toISOString() }));
}
