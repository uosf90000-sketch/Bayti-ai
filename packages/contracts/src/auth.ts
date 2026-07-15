/** S1 — تسجيل الدخول OTP (PRD §3-S1) */
import { z } from "zod";

export const OtpRequestInput = z.object({
  phone: z.string().regex(/^\+9665\d{8}$/, "رقم جوال سعودي بصيغة +9665XXXXXXXX"),
});
export const OtpRequestOutput = z.object({
  challenge_id: z.string(),
  resend_after_s: z.number().int().positive(),
});

export const OtpVerifyInput = z.object({
  challenge_id: z.string(),
  code: z.string().length(4),
});
export const OtpVerifyOutput = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: z.object({
    id: z.string(),
    phone: z.string(),
    full_name: z.string().nullable(),
    locale: z.literal("ar-SA"),
  }),
});

/** أخطاء RFC 9457 الموحدة */
export const ProblemDetails = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  request_id: z.string(),
});
export type ProblemDetails = z.infer<typeof ProblemDetails>;
