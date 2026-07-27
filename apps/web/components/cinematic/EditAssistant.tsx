"use client";
import { useEffect, useRef, useState } from "react";
import { parseIntent, versionsStore, fmtDelta, type ChatMsg, type Version } from "@/lib/chat";
import { sar } from "@/lib/mock";

/**
 * مساعد التعديل العائم — نفس منطق المحادثة الحقيقي (parseIntent/versionsStore)
 * لكن كطبقة فوق الجولة، لا صفحة منفصلة: لا يفقد المستخدم موقعه داخل الغرفة الحالية.
 */
export function EditAssistant({ projectId, realTotal }: { projectId: string; realTotal?: number | null }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", text: "أخبرني بأي تعديل — سأعرض عليك المعاينة والتكلفة قبل أي اعتماد، وموقعك هنا لا يتغيّر." },
  ]);
  const [resolved, setResolved] = useState<Record<number, "approved" | "dismissed">>({});
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const stored = versionsStore.get(projectId);
    // إن لم يوجد سجل تعديلات حقيقي بعد (النسخة الافتراضية المرجعية فقط)، نبدأ من تكلفة هذا المشروع
    // الفعلية بدل رقم فيلا العرض التجريبي — لا نخلط بين مشروعين أمام المستخدم نفسه
    const isDefaultSeed = stored.length === 1 && stored[0]!.n === 1 && stored[0]!.delta === 0;
    setVersions(isDefaultSeed && realTotal != null ? [{ ...stored[0]!, total: realTotal }] : stored);
  }, [projectId, open, realTotal]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const current = versions[versions.length - 1];
  const currentTotal = current?.total ?? 0;

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const reply = parseIntent(t, currentTotal);
    setMessages((m) => [...m, { role: "user", text: t }, reply]);
    setInput("");
  }

  function approve(msgIndex: number) {
    const msg = messages[msgIndex];
    if (msg.role !== "assistant" || !msg.preview) return;
    const next: Version = { n: versions.length + 1, summary: msg.preview.intent, total: currentTotal + msg.preview.costDelta, delta: msg.preview.costDelta, at: Date.now() };
    const list = [...versions, next];
    versionsStore.push(projectId, list);
    setVersions(list);
    setResolved((r) => ({ ...r, [msgIndex]: "approved" }));
    setMessages((m) => [...m, { role: "assistant", text: `تم الاعتماد ✓ (${fmtDelta(next.delta)})` }]);
  }

  return (
    <>
      <button
        type="button" onClick={() => setOpen((v) => !v)}
        className="btn btn-gold" aria-label="عدّل التصميم بالمحادثة"
        style={{ position: "fixed", bottom: 24, insetInlineEnd: 24, zIndex: 30, borderRadius: 999, minHeight: 52, padding: "0 22px", boxShadow: "var(--shadow)" }}
      >
        💬 عدّل التصميم
      </button>

      {open && (
        <div className="glass anim-fade-up" style={{ position: "fixed", bottom: 88, insetInlineEnd: 24, zIndex: 30, width: "min(360px, calc(100vw - 32px))", maxHeight: "60vh", display: "flex", flexDirection: "column", padding: 14 }}>
          <div ref={scrollRef} style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className="anim-fade-up" style={{ maxWidth: "88%", padding: "10px 12px", borderRadius: 12, fontSize: 13.5, background: m.role === "user" ? "color-mix(in srgb, var(--accent) 14%, var(--surface-2))" : "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <div>{m.text}</div>
                  {m.role === "assistant" && m.preview && !resolved[i] && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                      {m.preview.changes.map((c, ci) => (
                        <div key={ci} className="row" style={{ justifyContent: "space-between", gap: 8, fontSize: 12.5 }}>
                          <span>{c.text}</span>
                          <span className="dim num" style={{ whiteSpace: "nowrap" }}>{fmtDelta(c.delta)}</span>
                        </div>
                      ))}
                      <div className="row" style={{ justifyContent: "space-between", marginTop: 6, fontWeight: 700, fontSize: 13 }}>
                        <span>الفرق</span><span className="num gold">{fmtDelta(m.preview.costDelta)}</span>
                      </div>
                      <button className="btn btn-gold" style={{ marginTop: 8, minHeight: 36, padding: "0 14px", fontSize: 13, width: "100%" }} onClick={() => approve(i)}>اعتماد</button>
                    </div>
                  )}
                  {m.role === "assistant" && m.clarify && (
                    <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 6 }}>
                      {m.clarify.map((c) => (
                        <button key={c} className="chip" style={{ cursor: "pointer", border: "none", fontSize: 12 }} onClick={() => send(c)}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="row" style={{ marginTop: 10, gap: 6 }}>
            <input className="field" style={{ minHeight: 42, fontSize: 13.5 }} placeholder="غيّر الكنبة، اجعله أفخم…" value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" className="btn btn-gold" style={{ minHeight: 42, padding: "0 16px" }}>إرسال</button>
          </form>
          {currentTotal > 0 && <p className="dim t-sm num" style={{ marginTop: 6, textAlign: "center" }}>الإجمالي الحالي: {sar(currentTotal)}</p>}
        </div>
      )}
    </>
  );
}
