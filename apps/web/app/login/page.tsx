"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui";
import { auth } from "@/lib/services";
import { TEST_OTP_ALLOWED } from "@/lib/flags";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const validPhone = /^05\d{8}$/.test(phone);

  const requestOtp = async () => {
    setBusy(true); setError("");
    await auth.requestOtp(phone);
    setBusy(false); setStep("otp");
  };

  const verify = async () => {
    setBusy(true); setError("");
    const res = await auth.verifyOtp(phone, code);
    if (res.ok) {
      router.replace("/projects");
    } else {
      setBusy(false);
      setError(res.error ?? "تعذّر الدخول");
    }
  };

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="glass anim-fade-up" style={{ width: "100%", maxWidth: 420, padding: "34px 26px" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <Brand />
          <p className="muted" style={{ marginTop: 12, fontSize: 15 }}>
            {step === "phone" ? "أدخل رقم جوالك لنرسل لك رمز الدخول" : `أرسلنا رمزًا إلى ${phone}`}
          </p>
        </div>

        {step === "phone" ? (
          <div className="stack">
            <input
              className="field num" dir="ltr" style={{ textAlign: "center", letterSpacing: 2 }}
              inputMode="numeric" placeholder="05XXXXXXXX" maxLength={10}
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && validPhone && requestOtp()}
              aria-label="رقم الجوال"
            />
            <button className="btn btn-gold btn-block" disabled={!validPhone || busy} onClick={requestOtp}>
              {busy ? "جارٍ الإرسال…" : "أرسل الرمز"}
            </button>
          </div>
        ) : (
          <div className="stack">
            <input
              className="field num" dir="ltr"
              style={{ textAlign: "center", letterSpacing: 14, fontSize: 24 }}
              inputMode="numeric" placeholder="• • • •" maxLength={4} autoFocus
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && code.length === 4 && verify()}
              aria-label="رمز التحقق"
            />
            {error && <p style={{ color: "var(--danger)", fontSize: 14, textAlign: "center" }}>{error}</p>}
            <button className="btn btn-gold btn-block" disabled={code.length !== 4 || busy} onClick={verify}>
              {busy ? "جارٍ التحقق…" : "دخول"}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => { setStep("phone"); setCode(""); setError(""); }}>
              تغيير الرقم
            </button>
            {TEST_OTP_ALLOWED && (
              <p className="dim" style={{ textAlign: "center", fontSize: 13 }}>نسخة تجريبية — الرمز: 1234</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
