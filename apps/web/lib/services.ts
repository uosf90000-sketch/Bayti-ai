/**
 * واجهة الخدمات الموحدة — الشاشات تستدعي هذه الدوال فقط (AC12-3).
 * كل دالة: mock خلف flag اليوم، وخدمة حقيقية بنفس التوقيع غدًا.
 */
import { flags, TEST_OTP_ALLOWED } from "./flags";
import { store } from "./mock";

const notWired = (name: string): never => {
  throw new Error(`${name}: الخدمة الحقيقية غير مربوطة بعد — أبقِ الـ flag على mock`);
};

export const auth = {
  async requestOtp(phone: string): Promise<{ ok: true }> {
    if (!flags.USE_MOCK_AUTH) return notWired("auth.requestOtp");
    await new Promise((r) => setTimeout(r, 700));
    void phone;
    return { ok: true };
  },

  async verifyOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
    if (!flags.USE_MOCK_AUTH) return notWired("auth.verifyOtp");
    await new Promise((r) => setTimeout(r, 600));
    if (!TEST_OTP_ALLOWED) {
      return { ok: false, error: "الدخول التجريبي معطّل في بيئة الإنتاج." };
    }
    if (code !== "1234") {
      return { ok: false, error: "الرمز غير صحيح — في النسخة التجريبية استخدم 1234" };
    }
    store.login(phone);
    return { ok: true };
  },
};

/** حارس بسيط للشاشات المعتمدة على بيانات mock — يفشل بوضوح لو أُطفئ الـ flag قبل ربط البديل */
export function assertMock(flag: keyof typeof flags): void {
  if (!flags[flag]) notWired(flag);
}
