"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { store } from "@/lib/mock";
import { ThemeToggle } from "./theme";

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
        <ThemeToggle />
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

/** شريط الوكلاء المتحرك — يضاعف المحتوى للحلقة السلسة، ويوقفها عند تفضيل تقليل الحركة */
export function AgentMarquee({ agents }: { agents: { id: string; name: string; emoji: string }[] }) {
  const [duplicate, setDuplicate] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setDuplicate(!mq.matches);
    const handler = (e: MediaQueryListEvent) => setDuplicate(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const list = duplicate ? [...agents, ...agents] : agents;
  return (
    <div className="marquee">
      <div className="marquee-track">
        {list.map((a, i) => (
          <span key={`${a.id}-${i}`} className="chip" aria-hidden={i >= agents.length || undefined}>
            <span style={{ fontSize: 17 }}>{a.emoji}</span> {a.name}
          </span>
        ))}
      </div>
    </div>
  );
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
