"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { store } from "@/lib/mock";

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">ب</span>
      <span>بيتي <span className="gold">AI</span></span>
    </Link>
  );
}

export function TopBar({ backHref, action }: { backHref?: string; action?: React.ReactNode }) {
  return (
    <header className="topbar">
      <Brand />
      <div className="row">
        {action}
        {backHref && (
          <Link href={backHref} className="btn btn-ghost" style={{ minHeight: 40, padding: "0 16px", fontSize: 14 }}>
            رجوع
          </Link>
        )}
      </div>
    </header>
  );
}

/** حارس دخول بسيط — يُستبدل بجلسات حقيقية خلف نفس السلوك */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!store.isAuthed()) router.replace("/login");
  }, [router]);
  return <>{children}</>;
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    uploaded: { label: "بانتظار المخطط", cls: "chip" },
    analyzing: { label: "قيد التحليل", cls: "chip chip-gold" },
    needs_review: { label: "بانتظار مراجعتك", cls: "chip chip-gold" },
    generating: { label: "المجلس يعمل", cls: "chip chip-gold" },
    ready: { label: "جاهز ✓", cls: "chip chip-success" },
  };
  const s = map[status] ?? { label: status, cls: "chip" };
  return <span className={s.cls}>{s.label}</span>;
}
