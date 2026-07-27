"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar, RequireAuth } from "@/components/ui";
import { sar } from "@/lib/mock";
import { parseIntent, versionsStore, fmtDelta, type ChatMsg, type Version } from "@/lib/chat";

/* VS-3 — المحادثة والتعديل: معاينة → اعتماد = إصدار جديد → خط زمني ورجوع (P7/ADR-031) */

export default function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [versions, setVersions] = useState<Version[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", text: "أهلًا! أخبرني بأي تعديل تريده على بيتك — سأعرض عليك المعاينة والتكلفة قبل أي اعتماد." },
  ]);
  const [resolved, setResolved] = useState<Record<number, "approved" | "dismissed">>({});
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setVersions(versionsStore.get(id)), [id]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
    const next: Version = {
      n: versions.length + 1,
      summary: msg.preview.intent,
      total: currentTotal + msg.preview.costDelta,
      delta: msg.preview.costDelta,
      at: Date.now(),
    };
    const list = [...versions, next];
    versionsStore.push(id, list);
    setVersions(list);
    setResolved((r) => ({ ...r, [msgIndex]: "approved" }));
    setMessages((m) => [...m, { role: "assistant", text: `تم الاعتماد ✓ — الإصدار ${next.n} (${fmtDelta(next.delta)})` }]);
  }

  function dismiss(msgIndex: number) {
    setResolved((r) => ({ ...r, [msgIndex]: "dismissed" }));
  }

  function restore(v: Version) {
    const next: Version = {
      n: versions.length + 1,
      summary: `استعادة الإصدار ${v.n} — ${v.summary}`,
      total: v.total,
      delta: v.total - currentTotal,
      at: Date.now(),
      restoredFrom: v.n,
    };
    const list = [...versions, next];
    versionsStore.push(id, list);
    setVersions(list);
    setMessages((m) => [...m, { role: "assistant", text: `تمت الاستعادة ✓ — رجعنا لإصدار "${v.summary}" كإصدار جديد رقم ${next.n} (السجل لا يُحذف أبدًا)` }]);
  }

  return (
    <RequireAuth>
      <main>
        <TopBar
          backHref={`/projects/${id}/preview`}
          action={
            <div className="chip chip-gold num">{sar(currentTotal)}</div>
          }
        />
        <section className="section shell" style={{ display: "grid", gap: 18 }}>
          <div>
            <h1 className="h-xl">عدّل بيتك بالمحادثة</h1>
            <p className="muted t-sm" style={{ marginTop: 4 }}>كل تعديل يُعرض عليك أولًا بتفاصيله وفرق تكلفته — لا شيء يُطبَّق بدون اعتمادك</p>
          </div>

          {/* المحادثة */}
          <div className="card" style={{ padding: 16 }}>
            <div ref={scrollRef} style={{ maxHeight: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    className="anim-fade-up"
                    style={{
                      maxWidth: "84%", padding: "12px 14px", borderRadius: 14, fontSize: 15,
                      background: m.role === "user" ? "color-mix(in srgb, var(--accent) 14%, var(--surface-2))" : "var(--surface-2)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="t-body">{m.text}</div>

                    {m.role === "assistant" && m.preview && !resolved[i] && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                        <div className="dim t-sm" style={{ marginBottom: 6 }}>{m.preview.scope}</div>
                        <div className="stack" style={{ gap: 6 }}>
                          {m.preview.changes.map((c, ci) => (
                            <div key={ci} className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                              <span className="t-sm">{c.text}</span>
                              <span className="num t-sm dim" style={{ whiteSpace: "nowrap" }}>{fmtDelta(c.delta)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="row" style={{ justifyContent: "space-between", marginTop: 10, fontWeight: 700 }}>
                          <span>فرق التكلفة الإجمالي</span>
                          <span className="num gold">{fmtDelta(m.preview.costDelta)}</span>
                        </div>
                        <div className="row" style={{ marginTop: 12, gap: 8 }}>
                          <button className="btn btn-gold" style={{ minHeight: 42, padding: "0 18px", fontSize: 14.5 }} onClick={() => approve(i)}>
                            اعتماد التعديل
                          </button>
                          <button className="btn btn-ghost" style={{ minHeight: 42, padding: "0 18px", fontSize: 14.5 }} onClick={() => dismiss(i)}>
                            تجاهل
                          </button>
                        </div>
                      </div>
                    )}
                    {m.role === "assistant" && m.preview && resolved[i] === "dismissed" && (
                      <div className="dim t-sm" style={{ marginTop: 8 }}>تم التجاهل</div>
                    )}

                    {m.role === "assistant" && m.clarify && (
                      <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                        {m.clarify.map((c) => (
                          <button key={c} className="chip" style={{ cursor: "pointer", border: "none" }} onClick={() => send(c)}>
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="row"
              style={{ marginTop: 14, gap: 8 }}
            >
              <input
                className="field"
                placeholder="مثال: غيّر الكنبة، اجعل المجلس أفخم، خفّض الميزانية 10%"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="btn btn-gold" style={{ minHeight: 54, padding: "0 22px" }}>
                إرسال
              </button>
            </form>
          </div>

          {/* الإصدارات */}
          <div className="card" style={{ padding: 16 }}>
            <h3 className="h-lg" style={{ marginBottom: 10 }}>الإصدارات</h3>
            <div className="stack" style={{ gap: 8 }}>
              {[...versions].reverse().map((v) => {
                const isCurrent = v.n === current?.n;
                return (
                  <div key={v.n} className="row" style={{ justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 12, background: isCurrent ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="t-sm" style={{ fontWeight: 700 }}>
                        #{v.n} {v.summary} {isCurrent && <span className="gold">(الحالي)</span>}
                      </div>
                      <div className="dim t-sm num">{sar(v.total)} · {fmtDelta(v.delta)}</div>
                    </div>
                    {!isCurrent && (
                      <button className="btn btn-ghost" style={{ minHeight: 38, padding: "0 14px", fontSize: 13.5, whiteSpace: "nowrap" }} onClick={() => restore(v)}>
                        استعادة
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Link href={`/projects/${id}/preview`} className="btn btn-ghost btn-block" style={{ minHeight: 50 }}>
            رجوع للمعاينة
          </Link>
        </section>
      </main>
    </RequireAuth>
  );
}
